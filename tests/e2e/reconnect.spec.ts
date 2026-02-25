import { test, expect, type Page } from '@playwright/test';

async function createRoomFromHost(hostPage: Page): Promise<string> {
  await hostPage.goto('/host');
  await hostPage.waitForSelector('[data-testid="create-room-btn"]');
  await hostPage.click('[data-testid="create-room-btn"]');
  await hostPage.waitForSelector('[data-testid="host-room-code"]');
  const roomCode = await hostPage.textContent('[data-testid="host-room-code"]');
  return roomCode!.trim();
}

async function joinAsPlayer(playerPage: Page, roomCode: string, name: string): Promise<void> {
  await playerPage.goto('/play');
  await playerPage.waitForSelector('[data-testid="join-room-code"]');
  await playerPage.fill('[data-testid="join-room-code"]', roomCode);
  await playerPage.fill('[data-testid="join-display-name"]', name);
  await playerPage.click('[data-testid="join-btn"]');
  await playerPage.waitForSelector('[data-testid="waiting-player-list"]');
}

async function loadSampleBoard(hostPage: Page): Promise<void> {
  await hostPage.waitForSelector('[data-testid="load-sample-board"]');
  await hostPage.click('[data-testid="load-sample-board"]');
  await hostPage.waitForSelector('[data-testid="board-loaded"]');
}

test.describe('Reconnect Resilience', () => {
  test('6) Player disconnects and reconnects to same room', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();
    const roomCode = await createRoomFromHost(hostPage);

    const p1Context = await browser.newContext();
    const p1Page = await p1Context.newPage();
    await joinAsPlayer(p1Page, roomCode, 'Alice');

    await loadSampleBoard(hostPage);
    await hostPage.click('[data-testid="start-game-btn"]');
    await hostPage.waitForSelector('[data-testid="mini-board"]');

    // Player refreshes (disconnects and reconnects)
    await p1Page.reload();

    // The player should auto-rejoin via sessionStorage token
    // Wait for the game state to appear (either mini-board phase shows clue area or waiting text)
    await expect(async () => {
      const score = await p1Page.textContent('[data-testid="player-score"]');
      expect(score).toBeDefined();
    }).toPass({ timeout: 8000 });

    await hostContext.close();
    await p1Context.close();
  });
});
