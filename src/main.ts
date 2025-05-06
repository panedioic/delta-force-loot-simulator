import { Game } from "./game";

(async () => {
    const game = new Game();
    await game.init();
    console.log("Game initialized!");
})();
