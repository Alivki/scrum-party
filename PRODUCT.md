# Product

## Register

brand

## Users

Second-year **dataingeniør** and **systemutvikling** students at the Norwegian-language end-of-year party (russe-adjacent, but it's their semester wrap-up, not the high-school ritual). They use the site once — on the night — from phones at a dorm or shared venue, sometimes from a projector at the back of the room. They are technical, they will laugh at PM jargon, they speak Norwegian peppered with English software words.

Context of use:
- One night, one event. The site is the joke and the scoreboard.
- A mix of two-handed phone-poking and "show your screen to friends".
- Ambient light is low. Brightness is high. A few users will be inebriated by 22:00.
- Many users open the site at the same time, refresh it often to see the leaderboard move.

The job to be done:
1. Sign in with a name and a selfie in under 20 seconds.
2. Log every drink as an "issue" with size and ABV.
3. Watch the burndown trace downward and the leaderboard rearrange.
4. Poke at other people's boards for jokes ("look at Lars's backlog").

## Product Purpose

Scrumfest is an in-joke disguised as an enterprise tool. It treats one night of drinking as a single sprint and exposes Scrum's ceremonies, vocabulary, and graphs as the framework for getting drunk together. The point is not utility — the point is for a roomful of CS students to see their own velocity on a wall.

Success looks like:
- People want to log a drink because the points-popped feedback is satisfying.
- The leaderboard becomes contested by 21:00. People are taking shots specifically to leapfrog a rival.
- At least one screenshot of the burndown gets shared the next day.

## Brand Personality

Three words: **deadpan, declarative, printed.**

Voice: mock-formal scrum-speak in Norwegian (with English Scrum jargon left as-is, as engineers actually speak it). The interface treats drinking with the bone-dry seriousness of a PM dashboard. No exclamation marks. No party emojis in body copy. The HUMOR is in the contrast between the gravity of the language and the absurdity of the subject. Examples:

- "Daily standup avholdt. Velocity (alkohol-justert): 12 pt."
- "Issue lukket. Definition of Drunk oppnådd."
- "Estimat: 5 pt. Faktisk: 5 pt. Sprintet er på skinner."
- "Backlog grooming pågår."
- "Du er retired. Sprint suspendert."

Headlines are loud, body copy is dry. The visuals do the shouting; the words sound like a campus notice taped to a corkboard.

## Anti-references

Explicitly do NOT look like:
- **Generic Jira / Linear** — restrained product greys with one accent. We want a poster, not a tool.
- **Untz untz festival flyer** — gradients, lens flare, hero photos. Wrong kind of loud.
- **SaaS neon / cyberpunk-startup** — purple gradients, glass cards, glowy buttons. The previous draft of this site fell into this hole. Cyberpunk and "AI startup neon" are the trap to escape from.
- **Beer-brand kitsch** — pub-mat brown-and-gold, foamy serif logos. We are not a brewery.
- **Russetid clip-art chaos** — bright primary stickers piled at random. We are more deliberate than that.

The right reference is a Norwegian campus poster taped to a wall, printed on a Risograph: one bone-paper colour, one near-black ink, one screaming spot colour, hard rules, big condensed type, oversized numerals.

## Design Principles

1. **Sober tool, drunk subject.** The chrome behaves like a serious dashboard; the content describes drinking. The contrast is the joke. Never break character by adding "fun" affordances on top of the framework itself.
2. **Print first, screen second.** Compose like a poster: hard horizontal rules, asymmetric grids, oversized numerals, a single hot ink for emphasis. If a layout could be flattened to a sheet of A2 and still read, it's right.
3. **Numbers are the protagonist.** Story points, alkoholenheter, leaderboard rank, sprint countdown — these are the visual headlines, set huge. Body copy stays small and dry.
4. **One screaming colour, used like a stamp.** Risograph red is reserved for moments of consequence: the active rank, a closed point, a primary action. Everything else lives in bone + ink.
5. **Norwegian is the native language.** Default to Norwegian; let Scrum jargon stay English. Headlines are short and declarative; never use English fluff like "Get started" or "Welcome".

## Accessibility & Inclusion

- Target WCAG 2.2 AA contrast against bone paper for body and small UI text. Hot red is reserved for headlines and large numerals where contrast is not the limiting factor; never use red on bone for sub-16px body copy.
- All interactive elements must be reachable by keyboard. Dnd-kit kanban already exposes keyboard-sortable handles — keep that.
- `prefers-reduced-motion`: drop the float/wiggle/pulse animations to a single fade.
- The camera selfie step is OPTIONAL. Users who decline must still get a high-quality avatar fallback (initials on a hot-red ink stamp), not a degraded experience.
- Don't rely on colour alone to communicate state. The kanban column uses a wordmark + index number; "done" issues use strike-through + a stamp, not just a colour change.
