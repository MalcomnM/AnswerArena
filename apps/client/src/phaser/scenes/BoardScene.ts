import Phaser from 'phaser';
import type { PublicBoard } from '@answer-arena/shared';

const JEOPARDY_BLUE = 0x060CE9;
const JEOPARDY_DARK = 0x020077;
const GOLD = 0xFFD700;
const WHITE = 0xFFFFFF;
const RED = 0xC62828;
const USED_ALPHA = 0.15;
const CELL_BORDER = 0x000033;
const COLS = 6;
const ROWS = 5;

export class BoardScene extends Phaser.Scene {
  private board: PublicBoard | null = null;
  private cellTexts: Phaser.GameObjects.Text[][] = [];
  private catTexts: Phaser.GameObjects.Text[] = [];
  private cellBgs: Phaser.GameObjects.Rectangle[][] = [];
  private catBgs: Phaser.GameObjects.Rectangle[] = [];

  private clueOverlay: Phaser.GameObjects.Rectangle | null = null;
  private clueText: Phaser.GameObjects.Text | null = null;
  private clueValueText: Phaser.GameObjects.Text | null = null;
  private winnerText: Phaser.GameObjects.Text | null = null;
  private resultText: Phaser.GameObjects.Text | null = null;
  private answerText: Phaser.GameObjects.Text | null = null;

  private timerGraphics: Phaser.GameObjects.Graphics | null = null;
  private timerSecondsText: Phaser.GameObjects.Text | null = null;
  private timerDurationMs = 0;
  private timerEndTime = 0;
  private timerRunning = false;

  private isShowingClue = false;

  constructor() {
    super({ key: 'BoardScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor(JEOPARDY_BLUE);
    this.drawGrid();
    this.scale.on('resize', this.handleResize, this);
  }

  update() {
    if (this.timerRunning && this.timerGraphics) {
      this.drawTimerArc();
    }
  }

  private handleResize() {
    this.drawGrid();
  }

  private drawGrid() {
    this.cellTexts.forEach(row => row.forEach(t => t.destroy()));
    this.catTexts.forEach(t => t.destroy());
    this.cellBgs.forEach(row => row.forEach(r => r.destroy()));
    this.catBgs.forEach(r => r.destroy());
    this.cellTexts = [];
    this.catTexts = [];
    this.cellBgs = [];
    this.catBgs = [];

    const w = this.scale.width;
    const h = this.scale.height;
    const padding = 4;
    const catRowHeight = h * 0.15;
    const cellW = (w - padding * (COLS + 1)) / COLS;
    const cellH = (h - catRowHeight - padding * (ROWS + 2)) / ROWS;

    for (let c = 0; c < COLS; c++) {
      const x = padding + c * (cellW + padding);
      const catBg = this.add.rectangle(
        x + cellW / 2, padding + catRowHeight / 2,
        cellW, catRowHeight - padding,
        JEOPARDY_DARK,
      );
      catBg.setStrokeStyle(2, CELL_BORDER);
      this.catBgs.push(catBg);

      const catName = this.board?.categories[c]?.name ?? '';
      const catText = this.add.text(x + cellW / 2, padding + catRowHeight / 2, catName, {
        fontSize: `${Math.min(24, cellW / 6)}px`,
        fontFamily: 'Arial, sans-serif',
        color: '#FFFFFF',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: cellW - 16 },
      }).setOrigin(0.5).setDepth(1);
      this.catTexts.push(catText);

      const rowTexts: Phaser.GameObjects.Text[] = [];
      const rowBgs: Phaser.GameObjects.Rectangle[] = [];

      for (let r = 0; r < ROWS; r++) {
        const y = catRowHeight + padding + r * (cellH + padding);
        const bg = this.add.rectangle(
          x + cellW / 2, y + cellH / 2,
          cellW, cellH,
          JEOPARDY_BLUE,
        );
        bg.setStrokeStyle(2, CELL_BORDER);
        rowBgs.push(bg);

        const clue = this.board?.categories[c]?.clues[r];
        const value = clue?.value ?? (r + 1) * 200;
        const used = clue?.used ?? false;

        const text = this.add.text(
          x + cellW / 2, y + cellH / 2,
          `$${value}`,
          {
            fontSize: `${Math.min(40, cellH * 0.5)}px`,
            fontFamily: 'Arial, sans-serif',
            color: '#FFD700',
            fontStyle: 'bold',
            align: 'center',
          },
        ).setOrigin(0.5).setDepth(1);

        if (used) {
          text.setAlpha(USED_ALPHA);
          bg.setAlpha(USED_ALPHA);
        }

        rowTexts.push(text);
      }
      this.cellTexts.push(rowTexts);
      this.cellBgs.push(rowBgs);
    }
  }

  updateBoard(board: PublicBoard | null) {
    this.board = board;
    if (!this.isShowingClue) {
      this.drawGrid();
    }
  }

  showClueReveal(clueText: string, value: number) {
    if (this.isShowingClue) return;
    this.isShowingClue = true;
    const w = this.scale.width;
    const h = this.scale.height;

    if (!this.clueOverlay) {
      this.clueOverlay = this.add.rectangle(w / 2, h / 2, w, h, JEOPARDY_BLUE)
        .setDepth(100).setAlpha(0);
      this.clueValueText = this.add.text(w / 2, h * 0.15, '', {
        fontSize: '48px',
        fontFamily: 'Arial, sans-serif',
        color: '#FFD700',
        fontStyle: 'bold',
        align: 'center',
      }).setOrigin(0.5).setDepth(101).setAlpha(0);
      this.clueText = this.add.text(w / 2, h * 0.45, '', {
        fontSize: `${Math.min(48, w / 20)}px`,
        fontFamily: 'Arial, sans-serif',
        color: '#FFFFFF',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: w * 0.8 },
        lineSpacing: 12,
      }).setOrigin(0.5).setDepth(101).setAlpha(0);
      this.winnerText = this.add.text(w / 2, h * 0.72, '', {
        fontSize: '36px',
        fontFamily: 'Arial, sans-serif',
        color: '#FFD700',
        fontStyle: 'bold',
        align: 'center',
      }).setOrigin(0.5).setDepth(101).setAlpha(0);
      this.resultText = this.add.text(w / 2, h * 0.82, '', {
        fontSize: '40px',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        align: 'center',
      }).setOrigin(0.5).setDepth(101).setAlpha(0);
      this.answerText = this.add.text(w / 2, h * 0.92, '', {
        fontSize: '36px',
        fontFamily: 'Arial, sans-serif',
        color: '#FFD700',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: w * 0.8 },
      }).setOrigin(0.5).setDepth(101).setAlpha(0);

      this.timerGraphics = this.add.graphics().setDepth(102);
      this.timerSecondsText = this.add.text(w - 70, 70, '', {
        fontSize: '28px',
        fontFamily: 'Arial, sans-serif',
        color: '#FFFFFF',
        fontStyle: 'bold',
        align: 'center',
      }).setOrigin(0.5).setDepth(102).setAlpha(0);
    }

    this.clueOverlay.setPosition(w / 2, h / 2).setSize(w, h);
    this.clueValueText!.setPosition(w / 2, h * 0.15).setText(`$${value}`);
    this.clueText!.setPosition(w / 2, h * 0.45).setText(clueText)
      .setWordWrapWidth(w * 0.8);
    this.winnerText!.setText('').setAlpha(0);
    this.resultText!.setText('').setAlpha(0);
    this.answerText!.setText('').setAlpha(0);

    this.tweens.add({ targets: this.clueOverlay, alpha: 1, duration: 300 });
    this.tweens.add({ targets: this.clueValueText, alpha: 1, duration: 300, delay: 150 });
    this.tweens.add({ targets: this.clueText, alpha: 1, duration: 400, delay: 300 });
  }

  startTimer(durationMs: number) {
    this.timerDurationMs = durationMs;
    this.timerEndTime = Date.now() + durationMs;
    this.timerRunning = true;
    if (this.timerSecondsText) {
      this.timerSecondsText.setAlpha(1);
    }
  }

  syncTimer(remainingMs: number) {
    this.timerEndTime = Date.now() + remainingMs;
  }

  stopTimer() {
    this.timerRunning = false;
    if (this.timerGraphics) {
      this.timerGraphics.clear();
    }
    if (this.timerSecondsText) {
      this.timerSecondsText.setAlpha(0);
    }
  }

  private drawTimerArc() {
    const gfx = this.timerGraphics!;
    const w = this.scale.width;
    gfx.clear();

    const remaining = Math.max(0, this.timerEndTime - Date.now());
    const fraction = this.timerDurationMs > 0 ? remaining / this.timerDurationMs : 0;
    const seconds = Math.ceil(remaining / 1000);

    const cx = w - 70;
    const cy = 70;
    const radius = 35;
    const lineWidth = 5;

    gfx.lineStyle(lineWidth, 0x333366, 0.4);
    gfx.strokeCircle(cx, cy, radius);

    const color = fraction > 0.33 ? GOLD : RED;
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (fraction * Math.PI * 2);

    if (fraction > 0) {
      gfx.lineStyle(lineWidth, color, 1);
      gfx.beginPath();
      gfx.arc(cx, cy, radius, startAngle, endAngle, false);
      gfx.strokePath();
    }

    if (this.timerSecondsText) {
      this.timerSecondsText.setPosition(cx, cy).setText(`${seconds}`);
    }

    if (remaining <= 0) {
      this.stopTimer();
    }
  }

  hideClueReveal() {
    if (!this.isShowingClue) return;
    this.isShowingClue = false;
    this.stopTimer();

    const targets = [this.clueOverlay, this.clueValueText, this.clueText, this.winnerText, this.resultText, this.answerText].filter(Boolean);
    this.tweens.add({
      targets,
      alpha: 0,
      duration: 400,
      onComplete: () => {
        this.drawGrid();
      },
    });
  }

  showBuzzerWinner(displayName: string) {
    if (this.winnerText) {
      this.winnerText.setText(displayName).setAlpha(0);
      this.tweens.add({ targets: this.winnerText, alpha: 1, duration: 300 });
    }
  }

  showJudgeResult(correct: boolean) {
    if (this.resultText) {
      this.resultText
        .setText(correct ? 'CORRECT!' : 'INCORRECT')
        .setColor(correct ? '#4CAF50' : '#F44336')
        .setAlpha(0);
      this.tweens.add({ targets: this.resultText, alpha: 1, duration: 300 });
    }
  }

  startJudgingTimer(durationMs: number) {
    this.stopTimer();
    this.startTimer(durationMs);
  }

  stopJudgingTimer() {
    this.stopTimer();
  }

  showAnswer(answer: string) {
    if (this.answerText) {
      const w = this.scale.width;
      this.answerText
        .setPosition(w / 2, this.scale.height * 0.92)
        .setText(answer)
        .setAlpha(0);
      this.tweens.add({ targets: this.answerText, alpha: 1, duration: 400 });
    }
  }
}
