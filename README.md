# Domirush

Domirush is a browser-based domino circuit puzzle game. You get an 8×8 grid, a numbered **Start** on one border, a numbered **Target** on another, and a tray full of dominoes that may or may not belong in the solution. Your job is to bridge the two by placing tiles so every touching half shows the same pip value — then do it again, and again, because streak modes don't let you catch your breath.

It is still in early development — **Alpha v0.7.0** — so please bear with the rough edges. It needs more playtesting to see whether the loop lands with people who enjoy time-based puzzle games. There are no plans to support smartphones for now, but stay tuned.

## Features

As of v0.7.0, this is what actually works. Again, do not expect everything to work smoothly since this is still very early in development.

### Game modes

| Mode | Route | Puzzles | How it works |
| --- | --- | --- | --- |
| 5 Puzzle Streak | `/play/streak-5` | 5 | One clock. Five puzzles. Try not to choke on puzzle three. |
| 10 Puzzle Streak | `/play/streak-10` | 10 | Same deal, longer. The grid does not care about your stamina. |
| 15 Puzzle Streak | `/play/streak-15` | 15 | For people who looked at ten and thought, "cute." |

