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

test.describe('Gameplay Loop', () => {
  test('1) Room creation + join', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();
    const roomCode = await createRoomFromHost(hostPage);
    expect(roomCode).toHaveLength(5);

    const p1Context = await browser.newContext();
    const p1Page = await p1Context.newPage();
    await joinAsPlayer(p1Page, roomCode, 'Player1');

    const p2Context = await browser.newContext();
    const p2Page = await p2Context.newPage();
    await joinAsPlayer(p2Page, roomCode, 'Player2');

    await hostPage.waitForSelector('[data-testid="lobby-player"]');
    const playerChips = await hostPage.$$('[data-testid="lobby-player"]');
    expect(playerChips.length).toBe(2);

    await hostContext.close();
    await p1Context.close();
    await p2Context.close();
  });

  test('2) Start game + board renders', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();
    const roomCode = await createRoomFromHost(hostPage);

    const p1Context = await browser.newContext();
    const p1Page = await p1Context.newPage();
    await joinAsPlayer(p1Page, roomCode, 'Alice');

    await loadSampleBoard(hostPage);

    await hostPage.click('[data-testid="start-game-btn"]');
    await hostPage.waitForSelector('[data-testid="mini-board"]');

    const cells = await hostPage.$$('[data-testid^="mini-clue-"]');
    expect(cells.length).toBe(30);

    await hostContext.close();
    await p1Context.close();
  });

  test('3) Reveal clue + buzzer adjudication', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();
    const roomCode = await createRoomFromHost(hostPage);

    const p1Context = await browser.newContext();
    const p1Page = await p1Context.newPage();
    await joinAsPlayer(p1Page, roomCode, 'Alice');

    const p2Context = await browser.newContext();
    const p2Page = await p2Context.newPage();
    await joinAsPlayer(p2Page, roomCode, 'Bob');

    await loadSampleBoard(hostPage);
    await hostPage.click('[data-testid="start-game-btn"]');
    await hostPage.waitForSelector('[data-testid="mini-board"]');

    await hostPage.click('[data-testid="mini-clue-0-0"]');
    await hostPage.waitForSelector('[data-testid="reveal-clue-btn"]');
    await hostPage.click('[data-testid="reveal-clue-btn"]');

    await p1Page.waitForSelector('[data-testid="player-clue-text"]');
    const clueText = await p1Page.textContent('[data-testid="player-clue-text"]');
    expect(clueText).toBeTruthy();

    await hostPage.waitForSelector('[data-testid="open-buzzing-btn"]');
    await hostPage.click('[data-testid="open-buzzing-btn"]');

    await p1Page.waitForSelector('[data-testid="buzz-btn"]:not([disabled])');
    await p1Page.click('[data-testid="buzz-btn"]');

    await hostPage.waitForSelector('[data-testid="responder-name"]');
    const responder = await hostPage.textContent('[data-testid="responder-name"]');
    expect(responder).toBe('Alice');

    await hostContext.close();
    await p1Context.close();
    await p2Context.close();
  });

  test('4) Judge correct + scoring update', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();
    const roomCode = await createRoomFromHost(hostPage);

    const p1Context = await browser.newContext();
    const p1Page = await p1Context.newPage();
    await joinAsPlayer(p1Page, roomCode, 'Alice');

    await loadSampleBoard(hostPage);
    await hostPage.click('[data-testid="start-game-btn"]');
    await hostPage.waitForSelector('[data-testid="mini-board"]');

    await hostPage.click('[data-testid="mini-clue-0-0"]');
    await hostPage.waitForSelector('[data-testid="reveal-clue-btn"]');
    await hostPage.click('[data-testid="reveal-clue-btn"]');
    await hostPage.waitForSelector('[data-testid="open-buzzing-btn"]');
    await hostPage.click('[data-testid="open-buzzing-btn"]');

    await p1Page.waitForSelector('[data-testid="buzz-btn"]:not([disabled])');
    await p1Page.click('[data-testid="buzz-btn"]');

    await hostPage.waitForSelector('[data-testid="judge-correct-btn"]');
    await hostPage.click('[data-testid="judge-correct-btn"]');

    await p1Page.waitForSelector('[data-testid="player-score"]');
    await expect(async () => {
      const scoreText = await p1Page.textContent('[data-testid="player-score"]');
      expect(scoreText).toContain('200');
    }).toPass({ timeout: 5000 });

    await hostPage.waitForSelector('[data-testid="mini-board"]');
    const usedCell = hostPage.locator('[data-testid="mini-clue-0-0"]');
    await expect(usedCell).toBeDisabled();

    await hostContext.close();
    await p1Context.close();
  });

  test('5) Judge incorrect + rebuzz flow', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();
    const roomCode = await createRoomFromHost(hostPage);

    const p1Context = await browser.newContext();
    const p1Page = await p1Context.newPage();
    await joinAsPlayer(p1Page, roomCode, 'Alice');

    const p2Context = await browser.newContext();
    const p2Page = await p2Context.newPage();
    await joinAsPlayer(p2Page, roomCode, 'Bob');

    await loadSampleBoard(hostPage);
    await hostPage.click('[data-testid="start-game-btn"]');
    await hostPage.waitForSelector('[data-testid="mini-board"]');

    await hostPage.click('[data-testid="mini-clue-0-1"]');
    await hostPage.waitForSelector('[data-testid="reveal-clue-btn"]');
    await hostPage.click('[data-testid="reveal-clue-btn"]');
    await hostPage.waitForSelector('[data-testid="open-buzzing-btn"]');
    await hostPage.click('[data-testid="open-buzzing-btn"]');

    await p1Page.waitForSelector('[data-testid="buzz-btn"]:not([disabled])');
    await p1Page.click('[data-testid="buzz-btn"]');

    await hostPage.waitForSelector('[data-testid="judge-incorrect-btn"]');
    await hostPage.click('[data-testid="judge-incorrect-btn"]');

    await p2Page.waitForSelector('[data-testid="buzz-btn"]:not([disabled])', { timeout: 5000 });
    await p2Page.click('[data-testid="buzz-btn"]');

    await hostPage.waitForSelector('[data-testid="judge-correct-btn"]');
    await hostPage.click('[data-testid="judge-correct-btn"]');

    await expect(async () => {
      const scoreText = await p2Page.textContent('[data-testid="player-score"]');
      expect(scoreText).toContain('400');
    }).toPass({ timeout: 5000 });

    await hostContext.close();
    await p1Context.close();
    await p2Context.close();
  });
});
