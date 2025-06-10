import { Game } from "./game";
import { version } from "../package.json";

if (import.meta.env.MODE === "development") {
    console.log("Development mode!");
}

(async () => {
    const game = new Game();
    await game.init();
    console.log("Game initialized!");
    console.log("version:", version);
    console.log("game:", game);
})();
