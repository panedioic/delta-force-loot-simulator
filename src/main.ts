import { Game } from "./game";

if (import.meta.env.MODE === "development") {
    console.log("Development mode!");
}

(async () => {
    const game = new Game();
    await game.init();
    console.log("Game initialized!");
    console.log(game);
})();
