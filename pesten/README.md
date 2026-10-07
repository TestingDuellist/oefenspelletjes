# Pesten Card Club

Open `../pesten.html` or use the main game menu. Static HTML, CSS and JavaScript; no build or API keys. The shared Card Club stylesheet is `../big-two/style.css`.

Four players, seven starting cards, standard 52-card deck plus two jokers. Suit or rank matching; jacks are wild except on another jack; jokers are wild outside penalties. Twos stack on twos, jokers stack on jokers, without mixing. Sevens retain the turn, eights skip the next player, aces reverse direction, jacks/jokers choose the active suit. A draw allows only the drawn card to be played immediately; accepting a penalty ends the turn. Every special card can finish the game. Announce before going from two cards to one or draw two penalty cards. AI always announces.

The discard pile is recycled when necessary while preserving its top card. Draws are limited to available cards if exhausted. The starting discard is an ordinary card; human starts each round. These house rules are explicitly displayed in the game.

AI receives only its own cards and public information. Relaxed picks random legal cards. Slim favors its dominant suit and extra/skip turns while conserving wild cards. Expert prioritizes penalties/skips against a next player with two or fewer cards. XP, streaks and badges use `pestenProfileV1`, independent of Big Two. Completed rounds earn 25 XP plus 100 for a win. Levels every 200 XP; badges for first win, three wins in a row, Expert win, and ten correct last-card announcements.

Tests:

```sh
node --test tests/pesten.test.cjs
```
