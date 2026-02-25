import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@answer-arena/shared';
import { RoomManager } from '../modules/RoomManager.js';
import { transition } from '../modules/GameStateMachine.js';
import { receiveBuzz } from '../modules/BuzzerAdjudicator.js';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function registerSocketHandlers(io: TypedServer, roomManager: RoomManager): void {
  io.on('connection', (socket: TypedSocket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ─── Host Events ───

    socket.on('host:create_room', (_payload, ack) => {
      const { roomCode, hostPin } = roomManager.createRoom(socket.id);
      socket.join(roomCode);
      ack({ roomCode, hostPin });
    });

    socket.on('host:start_game', (payload) => {
      const room = roomManager.getRoom(payload.roomCode);
      if (!room || room.hostId !== socket.id) return;
      if (!room.board) {
        socket.emit('error', { code: 'NO_BOARD', message: 'No board loaded. Generate a board first.' });
        return;
      }

      try {
        const newState = transition(room, { type: 'HOST_START_GAME' });
        roomManager.setRoom(payload.roomCode, newState);
        io.to(payload.roomCode).emit('room:state_update', roomManager.toPublicState(newState));
      } catch (err) {
        socket.emit('error', { code: 'INVALID_TRANSITION', message: String(err) });
      }
    });

    socket.on('host:select_clue', (payload) => {
      const room = findHostRoom(socket);
      if (!room) return;

      try {
        const newState = transition(room, {
          type: 'HOST_SELECT_CLUE',
          categoryIndex: payload.categoryIndex,
          clueIndex: payload.clueIndex,
        });
        roomManager.setRoom(room.roomCode, newState);

        io.to(room.roomCode).emit('clue:selected', {
          categoryIndex: payload.categoryIndex,
          clueIndex: payload.clueIndex,
        });

        if (newState.activeClue) {
          socket.emit('clue:full_data', {
            clueText: newState.activeClue.clue.clue,
            value: newState.activeClue.clue.value,
            answer: newState.activeClue.clue.answer,
            acceptable: newState.activeClue.clue.acceptable,
            explanation: newState.activeClue.clue.explanation,
          });
        }

        io.to(room.roomCode).emit('room:state_update', roomManager.toPublicState(newState));
      } catch (err) {
        socket.emit('error', { code: 'INVALID_TRANSITION', message: String(err) });
      }
    });

    socket.on('host:reveal_clue', () => {
      const room = findHostRoom(socket);
      if (!room) return;

      try {
        const newState = transition(room, { type: 'HOST_REVEAL_CLUE' });
        roomManager.setRoom(room.roomCode, newState);

        if (newState.activeClue) {
          io.to(room.roomCode).emit('clue:revealed', {
            clueText: newState.activeClue.clue.clue,
            value: newState.activeClue.clue.value,
            timerDurationMs: newState.activeClue.timerDurationMs,
          });
        }

        io.to(room.roomCode).emit('room:state_update', roomManager.toPublicState(newState));
      } catch (err) {
        socket.emit('error', { code: 'INVALID_TRANSITION', message: String(err) });
      }
    });

    socket.on('host:open_buzzing', () => {
      const room = findHostRoom(socket);
      if (!room) return;

      try {
        const newState = transition(room, { type: 'HOST_OPEN_BUZZING' });
        roomManager.setRoom(room.roomCode, newState);

        const timerRemainingMs = newState.activeClue
          ? newState.activeClue.timerDurationMs - (Date.now() - newState.activeClue.timerStartedAt)
          : newState.settings.timerDurationMs;

        io.to(room.roomCode).emit('buzzer:opened', { timerRemainingMs: Math.max(0, timerRemainingMs) });
        io.to(room.roomCode).emit('room:state_update', roomManager.toPublicState(newState));

        scheduleTimerExpiry(io, roomManager, room.roomCode, Math.max(0, timerRemainingMs));
      } catch (err) {
        socket.emit('error', { code: 'INVALID_TRANSITION', message: String(err) });
      }
    });

    socket.on('host:judge', (payload) => {
      const room = findHostRoom(socket);
      if (!room || !room.buzzerState?.winnerId) return;

      const playerId = room.buzzerState.winnerId;
      const player = room.players[playerId];
      const value = room.activeClue?.clue.value ?? 0;

      try {
        let newState: typeof room;
        if (payload.correct) {
          newState = transition(room, { type: 'HOST_JUDGE_CORRECT', playerId });
        } else {
          newState = transition(room, {
            type: 'HOST_JUDGE_INCORRECT',
            playerId,
            reopenBuzzing: payload.reopenBuzzing ?? true,
          });
        }
        roomManager.setRoom(room.roomCode, newState);

        const updatedPlayer = newState.players[playerId];
        io.to(room.roomCode).emit('judge:result', {
          correct: payload.correct,
          playerId,
          scoreChange: payload.correct ? value : (room.settings.penaltyEnabled ? -value : 0),
          newScore: updatedPlayer?.score ?? 0,
        });

        if (newState.phase === 'BUZZING_OPEN') {
          const timerRemainingMs = newState.activeClue
            ? newState.activeClue.timerDurationMs - (Date.now() - newState.activeClue.timerStartedAt)
            : 0;
          io.to(room.roomCode).emit('buzzer:opened', { timerRemainingMs: Math.max(0, timerRemainingMs) });
          scheduleTimerExpiry(io, roomManager, room.roomCode, Math.max(0, timerRemainingMs));
        }

        io.to(room.roomCode).emit('room:state_update', roomManager.toPublicState(newState));
      } catch (err) {
        socket.emit('error', { code: 'INVALID_TRANSITION', message: String(err) });
      }
    });

    socket.on('host:skip_clue', () => {
      const room = findHostRoom(socket);
      if (!room) return;

      try {
        const newState = transition(room, { type: 'HOST_SKIP_CLUE' });
        roomManager.setRoom(room.roomCode, newState);
        io.to(room.roomCode).emit('room:state_update', roomManager.toPublicState(newState));
      } catch (err) {
        socket.emit('error', { code: 'INVALID_TRANSITION', message: String(err) });
      }
    });

    socket.on('host:show_answer', () => {
      const room = findHostRoom(socket);
      if (!room || !room.activeClue) return;

      io.to(room.roomCode).emit('answer:revealed', {
        answer: room.activeClue.clue.answer,
      });
    });

    socket.on('host:return_to_board', () => {
      const room = findHostRoom(socket);
      if (!room) return;

      try {
        const newState = transition(room, { type: 'HOST_RETURN_TO_BOARD' });
        roomManager.setRoom(room.roomCode, newState);

        if (newState.phase === 'GAME_OVER') {
          const finalScores: Record<string, number> = {};
          for (const [id, p] of Object.entries(newState.players)) {
            finalScores[id] = p.score;
          }
          io.to(room.roomCode).emit('game:over', { finalScores });
        }

        io.to(room.roomCode).emit('room:state_update', roomManager.toPublicState(newState));
      } catch (err) {
        socket.emit('error', { code: 'INVALID_TRANSITION', message: String(err) });
      }
    });

    socket.on('host:reclaim', (payload, ack) => {
      const success = roomManager.reclaimHost(payload.roomCode, payload.hostPin, socket.id);
      if (success) {
        socket.join(payload.roomCode);
      }
      ack({ success });
    });

    // ─── Board TV Events ───

    socket.on('board:join', (payload, ack) => {
      const room = roomManager.getRoom(payload.roomCode);
      if (!room) {
        ack({ code: 'ROOM_NOT_FOUND', message: 'Room not found' } as any);
        return;
      }
      socket.join(payload.roomCode);
      ack({ state: roomManager.toPublicState(room) });
    });

    // ─── Player Events ───

    socket.on('player:join', (payload, ack) => {
      console.log(`Player join attempt: room=${payload.roomCode}, name=${payload.displayName}, socket=${socket.id}`);
      if (!roomManager.getRoom(payload.roomCode)) {
        console.log(`Player join failed: room '${payload.roomCode}' not found`);
        ack({ code: 'ROOM_NOT_FOUND', message: 'Room not found. Check the code and try again.' } as any);
        return;
      }
      const result = roomManager.joinRoom(payload.roomCode, payload.displayName, socket.id);
      if (!result) {
        console.log(`Player join failed: room full or other error for '${payload.roomCode}'`);
        ack({ code: 'JOIN_FAILED', message: 'Could not join room. It may be full.' } as any);
        return;
      }

      socket.join(payload.roomCode);

      const room = roomManager.getRoom(payload.roomCode)!;
      io.to(payload.roomCode).emit('room:player_joined', { player: result.player });
      io.to(payload.roomCode).emit('room:state_update', roomManager.toPublicState(room));

      ack({
        playerId: result.playerId,
        token: result.token,
        state: roomManager.toPublicState(room),
      });
    });

    socket.on('player:buzz', (_payload, ack) => {
      const mapping = roomManager.getPlayerBySocket(socket.id);
      if (!mapping) {
        ack({ accepted: false, reason: 'not_in_round' });
        return;
      }

      const room = roomManager.getRoom(mapping.roomCode);
      if (!room) {
        ack({ accepted: false, reason: 'not_in_round' });
        return;
      }

      const result = receiveBuzz(room, mapping.playerId, Date.now());
      ack({ accepted: result.accepted, reason: result.reason });

      if (result.accepted && result.winnerId) {
        const newState = transition(room, {
          type: 'FIRST_BUZZ',
          playerId: result.winnerId,
          serverTimestamp: Date.now(),
        });
        roomManager.setRoom(room.roomCode, newState);

        const winner = room.players[result.winnerId];
        io.to(room.roomCode).emit('buzzer:winner', {
          playerId: result.winnerId,
          displayName: winner?.displayName ?? 'Unknown',
        });
        io.to(room.roomCode).emit('buzzer:closed', { reason: 'won' });
        io.to(room.roomCode).emit('room:state_update', roomManager.toPublicState(newState));

        if (newState.activeClue) {
          const hostSocket = io.sockets.sockets.get(newState.hostId);
          if (hostSocket) {
            hostSocket.emit('clue:full_data', {
              clueText: newState.activeClue.clue.clue,
              value: newState.activeClue.clue.value,
              answer: newState.activeClue.clue.answer,
              acceptable: newState.activeClue.clue.acceptable,
              explanation: newState.activeClue.clue.explanation,
            });
          }
        }
      } else {
        io.to(room.roomCode).emit('buzzer:attempt', {
          playerId: mapping.playerId,
          accepted: false,
          reason: result.reason,
        });
      }
    });

    socket.on('player:rejoin', (payload, ack) => {
      const result = roomManager.rejoinRoom(payload.roomCode, payload.token, socket.id);
      if (!result) {
        ack({ code: 'REJOIN_FAILED', message: 'Could not rejoin room' } as any);
        return;
      }

      socket.join(payload.roomCode);
      const room = roomManager.getRoom(payload.roomCode)!;
      io.to(payload.roomCode).emit('room:state_update', roomManager.toPublicState(room));

      ack({
        state: roomManager.toPublicState(room),
        playerId: result.playerId,
      });
    });

    // ─── Disconnect ───

    socket.on('disconnect', () => {
      const mapping = roomManager.handleDisconnect(socket.id);
      if (mapping) {
        const room = roomManager.getRoom(mapping.roomCode);
        if (room) {
          io.to(mapping.roomCode).emit('room:player_left', { playerId: mapping.playerId });
          io.to(mapping.roomCode).emit('room:state_update', roomManager.toPublicState(room));
        }
      }
    });

    function findHostRoom(sock: TypedSocket) {
      for (const roomCode of sock.rooms) {
        if (roomCode === sock.id) continue;
        const room = roomManager.getRoom(roomCode);
        if (room && room.hostId === sock.id) return room;
      }
      return null;
    }
  });
}

const activeTimers = new Map<string, NodeJS.Timeout>();

function scheduleTimerExpiry(
  io: TypedServer,
  roomManager: RoomManager,
  roomCode: string,
  durationMs: number,
): void {
  const existing = activeTimers.get(roomCode);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    activeTimers.delete(roomCode);
    const room = roomManager.getRoom(roomCode);
    if (!room || room.phase !== 'BUZZING_OPEN') return;

    try {
      const newState = transition(room, { type: 'TIMER_EXPIRED' });
      roomManager.setRoom(roomCode, newState);
      io.to(roomCode).emit('buzzer:closed', { reason: 'timeout' });
      io.to(roomCode).emit('room:state_update', roomManager.toPublicState(newState));
    } catch {
      // Timer expired but state already changed
    }
  }, durationMs);

  activeTimers.set(roomCode, timer);
}
