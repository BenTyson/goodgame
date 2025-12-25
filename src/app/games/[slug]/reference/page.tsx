import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Zap, ExternalLink, Users, Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PrintButton } from '@/components/ui/print-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getGameBySlug, getAllGameSlugs } from '@/lib/supabase/queries'

interface ReferencePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: ReferencePageProps): Promise<Metadata> {
  const { slug } = await params
  const game = await getGameBySlug(slug)

  if (!game) {
    return {
      title: 'Game Not Found',
    }
  }

  return {
    title: `${game.name} Quick Reference`,
    description: `Quick reference card for ${game.name}. Key rules, turn structure, and important reminders at a glance.`,
  }
}

export async function generateStaticParams() {
  const slugs = await getAllGameSlugs()
  return slugs.map((slug) => ({ slug }))
}

// Type for AI-generated content
interface AIReferenceContent {
  turnSummary: string[]
  actions: { name: string; cost: string; effect: string; limit: string }[]
  symbols: { symbol: string; meaning: string }[]
  scoring: { category: string; points: string; notes: string }[]
  importantNumbers: { what: string; value: string; context: string }[]
  reminders: string[]
}

// Type for legacy hardcoded content
interface LegacyReferenceContent {
  turnSummary: { phase: string; action: string }[]
  keyRules: { rule: string; detail: string }[]
  costs: { item: string; cost: string }[]
  quickReminders: string[]
  endGame: string
}

type ReferenceContent = AIReferenceContent | LegacyReferenceContent

// Helper to check if content is AI-generated format
function isAIContent(content: ReferenceContent): content is AIReferenceContent {
  return 'actions' in content || 'symbols' in content || 'importantNumbers' in content
}

// Reference content for each game
const referenceContent: Record<string, LegacyReferenceContent> = {
  catan: {
    turnSummary: [
      { phase: '1. Roll Dice', action: 'All players collect resources from hexes matching the number.' },
      { phase: '2. Trade', action: 'Negotiate with players (any ratio) or bank (4:1 or port rates).' },
      { phase: '3. Build', action: 'Spend resources to build roads, settlements, cities, or buy dev cards.' },
    ],
    keyRules: [
      { rule: 'Robber (7 rolled)', detail: 'Players with 8+ cards discard half. Move robber, steal 1 card from adjacent player.' },
      { rule: 'Settlement Placement', detail: 'Must be 2+ road segments away from any other settlement/city.' },
      { rule: 'Longest Road', detail: 'Need 5+ continuous road segments. Worth 2 VP. Can be stolen.' },
      { rule: 'Largest Army', detail: 'Need 3+ played knight cards. Worth 2 VP. Can be stolen.' },
      { rule: 'Ports', detail: '3:1 general ports or 2:1 specific resource ports improve bank trades.' },
    ],
    costs: [
      { item: 'Road', cost: '1 Brick + 1 Lumber' },
      { item: 'Settlement', cost: '1 Brick + 1 Lumber + 1 Wool + 1 Grain' },
      { item: 'City (upgrade)', cost: '3 Ore + 2 Grain' },
      { item: 'Development Card', cost: '1 Ore + 1 Wool + 1 Grain' },
    ],
    quickReminders: [
      'Max 5 settlements, 4 cities, 15 roads per player',
      'Cannot build more cities than you have settlements to upgrade',
      'Can only play 1 development card per turn (except Victory Points)',
      'Knights must be played BEFORE rolling dice to move robber',
    ],
    endGame: 'First player to reach 10 Victory Points on their turn wins!',
  },
  wingspan: {
    turnSummary: [
      { phase: 'Play a Bird', action: 'Pay food cost + eggs (1 per bird in row). Place in matching habitat.' },
      { phase: 'Gain Food', action: 'Forest action: take food from feeder, activate forest bird powers.' },
      { phase: 'Lay Eggs', action: 'Grassland action: lay eggs on birds, activate grassland bird powers.' },
      { phase: 'Draw Cards', action: 'Wetland action: draw bird cards, activate wetland bird powers.' },
    ],
    keyRules: [
      { rule: 'Habitat Powers', detail: 'Activate ALL powers in the row from right to left.' },
      { rule: 'Egg Limit', detail: 'Each bird has an egg limit shown on its card.' },
      { rule: 'Birdfeeder Empty', detail: 'If empty, reroll all dice. If only 1 face showing, may reroll.' },
      { rule: 'Tucking Cards', detail: 'Tucked cards are worth 1 VP each at game end.' },
      { rule: 'Cached Food', detail: 'Cached food on birds is worth 1 VP each at game end.' },
    ],
    costs: [
      { item: 'Column 1 bird', cost: 'Food only' },
      { item: 'Column 2 bird', cost: 'Food + 1 egg' },
      { item: 'Column 3 bird', cost: 'Food + 2 eggs' },
      { item: 'Column 4 bird', cost: 'Food + 3 eggs' },
      { item: 'Column 5 bird', cost: 'Food + 4 eggs' },
    ],
    quickReminders: [
      '4 rounds total, decreasing action cubes each round (8, 7, 6, 5)',
      'End of round: score goals, discard face-up birds, reset bird tray',
      'Pink powers: activate when played. Brown powers: activate each turn.',
      'White powers: activate on other players\' turns (once between your turns)',
    ],
    endGame: 'After 4 rounds, count: bird points + bonus cards + goals + eggs + cached food + tucked cards.',
  },
  'ticket-to-ride': {
    turnSummary: [
      { phase: 'Draw Cards', action: 'Draw 2 train cards (face-up or deck). Locomotive face-up = 1 card only.' },
      { phase: 'Claim Route', action: 'Play matching cards to claim a route. Score points immediately.' },
      { phase: 'Draw Tickets', action: 'Draw 3 destination tickets, keep at least 1.' },
    ],
    keyRules: [
      { rule: 'Locomotives', detail: 'Wild cards. Taking face-up locomotive counts as entire draw action.' },
      { rule: 'Double Routes', detail: '2-3 players: only one route can be claimed. 4-5 players: both available.' },
      { rule: 'Destination Tickets', detail: 'Completed = add points. Incomplete = subtract points at game end.' },
      { rule: 'Gray Routes', detail: 'Can be claimed with any single color of cards.' },
    ],
    costs: [
      { item: '1-car route', cost: '1 point' },
      { item: '2-car route', cost: '2 points' },
      { item: '3-car route', cost: '4 points' },
      { item: '4-car route', cost: '7 points' },
      { item: '5-car route', cost: '10 points' },
      { item: '6-car route', cost: '15 points' },
    ],
    quickReminders: [
      'Hand limit: none (keep all cards)',
      'If deck runs out, shuffle discards',
      'When 3 locomotives face-up, discard all 5 and redraw',
      'Longest Path bonus: 10 points at game end',
    ],
    endGame: 'Triggered when any player has 2 or fewer trains. Each player gets one more turn, then final scoring.',
  },
  azul: {
    turnSummary: [
      { phase: '1. Factory Offer', action: 'Take ALL tiles of ONE color from a factory or center. Others go to center.' },
      { phase: '2. Pattern Lines', action: 'Place tiles in ONE pattern line (right side). Excess goes to floor.' },
      { phase: '3. Wall Tiling', action: 'At round end: move 1 tile from each complete line to matching wall space.' },
    ],
    keyRules: [
      { rule: 'Pattern Lines', detail: 'Each line can only hold ONE color. Must match the row\'s open wall spaces.' },
      { rule: 'Floor Line', detail: 'Tiles that can\'t/won\'t be placed go here. Negative points: -1, -1, -2, -2, -2, -3, -3.' },
      { rule: 'Starting Player', detail: 'First to take from center takes "1" tile (goes to floor, worth -1).' },
      { rule: 'Completed Lines', detail: 'Excess tiles from completed lines go to floor.' },
    ],
    costs: [
      { item: 'Single tile placed', cost: '1 point' },
      { item: 'Horizontal adjacent', cost: '+1 per tile in row' },
      { item: 'Vertical adjacent', cost: '+1 per tile in column' },
      { item: 'Complete horizontal row', cost: '+2 bonus' },
      { item: 'Complete vertical column', cost: '+7 bonus' },
      { item: 'Complete color (all 5)', cost: '+10 bonus' },
    ],
    quickReminders: [
      'Cannot place a color in a row that already has it on the wall',
      'Tiles on floor score NEGATIVE points',
      'At end of round, discard tiles from completed pattern lines to box lid',
      'Incomplete pattern lines carry over to next round',
    ],
    endGame: 'Game ends when any player completes a horizontal row on their wall. Finish the round, then final scoring.',
  },
  codenames: {
    turnSummary: [
      { phase: 'Spymaster Clue', action: 'Give ONE word + number (how many cards relate). No gestures/hints.' },
      { phase: 'Team Guesses', action: 'Touch cards one at a time. Must guess at least once, may guess up to number+1.' },
      { phase: 'Reveal', action: 'Cover guessed card with correct agent/bystander/assassin card.' },
    ],
    keyRules: [
      { rule: 'Clue Rules', detail: 'One word only. Must relate to meaning. Cannot rhyme or spell card words.' },
      { rule: 'Assassin', detail: 'Instant loss if your team touches the assassin word.' },
      { rule: 'Bystander', detail: 'Neutral card - turn ends but no penalty.' },
      { rule: 'Opponent\'s Agent', detail: 'Helps opponent\'s team. Turn ends.' },
      { rule: 'Unlimited Clue', detail: 'Saying "unlimited" instead of number lets team guess until wrong.' },
    ],
    costs: [
      { item: 'Starting team agents', cost: '9 words' },
      { item: 'Second team agents', cost: '8 words' },
      { item: 'Bystanders', cost: '7 words' },
      { item: 'Assassin', cost: '1 word' },
    ],
    quickReminders: [
      'Spymasters: don\'t react to team discussion',
      'Team must touch a card to make it official',
      'Zero clue: "0" means avoid these words',
      'Keep used key cards separate from unused',
    ],
    endGame: 'Game ends when all of one team\'s agents found (win) or assassin touched (lose).',
  },
  'terraforming-mars': {
    turnSummary: [
      { phase: '1-2 Actions', action: 'Take 1-2 actions OR pass for rest of generation. Actions repeat until all pass.' },
      { phase: 'Production', action: 'After all pass: gain resources = production + TR.' },
      { phase: 'New Generation', action: 'Draw 4 cards, keep any (pay 3M€ each). Advance generation marker.' },
    ],
    keyRules: [
      { rule: 'Standard Projects', detail: 'Always available: Sell cards, Power Plant, Asteroid, Aquifer, Greenery, City.' },
      { rule: 'Milestones', detail: 'First 3 claimed only. Cost 8M€ each. Worth 5 VP.' },
      { rule: 'Awards', detail: 'First 3 funded only. Cost 8/14/20M€. 1st: 5VP, 2nd: 2VP.' },
      { rule: 'Ocean Tiles', detail: 'Cannot be on reserved spaces. +1 TR when placed.' },
      { rule: 'Greenery/Cities', detail: 'Greenery +1 oxygen +1 TR. Cities must be next to no other cities.' },
    ],
    costs: [
      { item: 'Power Plant', cost: '11M€ (+1 energy production)' },
      { item: 'Asteroid', cost: '14M€ (+1 temperature)' },
      { item: 'Aquifer', cost: '18M€ (+1 ocean tile)' },
      { item: 'Greenery', cost: '23M€ (+1 greenery tile)' },
      { item: 'City', cost: '25M€ (+1 city tile)' },
    ],
    quickReminders: [
      'TR = base income + victory points',
      'Tags on cards matter for prerequisites and bonuses',
      'Events (red) are played face-down, tags don\'t count after',
      'Blue cards with actions: use once per generation',
    ],
    endGame: 'When all 3 global parameters maxed (14% O2, +8°C, 9 oceans). Final greenery placement, then scoring.',
  },
  splendor: {
    turnSummary: [
      { phase: 'Option A', action: 'Take 3 different gem tokens' },
      { phase: 'Option B', action: 'Take 2 same-color gems (if 4+ available)' },
      { phase: 'Option C', action: 'Reserve a card + take 1 gold' },
      { phase: 'Option D', action: 'Purchase a card with gems' },
      { phase: 'End of turn', action: 'Receive noble visit if qualified' },
    ],
    keyRules: [
      { rule: 'Max 10 gems', detail: 'Must return excess gems to supply' },
      { rule: 'Max 3 reserved', detail: 'Cannot reserve 4th card' },
      { rule: 'Gold is wild', detail: 'Replaces any gem color' },
      { rule: 'Noble visits', detail: 'Automatic when you meet bonus requirements' },
      { rule: 'Cards = permanent gems', detail: 'Reduce future purchase costs' },
    ],
    costs: [
      { item: 'Level 1 cards', cost: '2-4 gems, 0-1 VP' },
      { item: 'Level 2 cards', cost: '4-6 gems, 1-3 VP' },
      { item: 'Level 3 cards', cost: '6-7 gems, 3-5 VP' },
      { item: 'Nobles', cost: '3 VP each (free when qualified)' },
    ],
    quickReminders: [
      'Taking 2 same gems requires 4+ in supply',
      'Cards reduce cost permanently',
      'Gold tokens are wild but limited (5 total)',
      'Nobles come to you - no action needed',
    ],
    endGame: 'First player to 15+ prestige points triggers final round. Highest score after that round wins.',
  },
  pandemic: {
    turnSummary: [
      { phase: '1. Actions (4)', action: 'Move, treat, share, cure, build' },
      { phase: '2. Draw', action: 'Draw 2 player cards (hand limit 7)' },
      { phase: '3. Infect', action: 'Draw infection cards = rate' },
    ],
    keyRules: [
      { rule: 'Outbreak', detail: '4th cube = spread to all connected cities' },
      { rule: 'Cure', detail: '5 matching cards at research station' },
      { rule: 'Eradicate', detail: 'Cure + remove all cubes = no new infections' },
      { rule: 'Hand limit', detail: '7 cards max (discard at end of turn)' },
      { rule: 'Epidemic', detail: 'Infect new city, shuffle discards on top' },
    ],
    costs: [
      { item: 'Move (drive/ferry)', cost: '1 action' },
      { item: 'Move (direct flight)', cost: '1 action + discard destination card' },
      { item: 'Move (charter)', cost: '1 action + discard current city card' },
      { item: 'Treat disease', cost: '1 action = remove 1 cube (all if cured)' },
      { item: 'Build station', cost: '1 action + current city card' },
      { item: 'Share knowledge', cost: '1 action (same city, that city\'s card)' },
      { item: 'Discover cure', cost: '1 action + 5 matching cards at station' },
    ],
    quickReminders: [
      'Cooperate! Discuss strategy openly',
      '8 outbreaks = immediate loss',
      'Running out of cubes/cards = loss',
      'Use role abilities every turn',
    ],
    endGame: 'Win: Cure all 4 diseases. Lose: 8 outbreaks, run out of cubes, or player deck empty.',
  },
  carcassonne: {
    turnSummary: [
      { phase: '1. Draw', action: 'Draw and reveal a tile' },
      { phase: '2. Place', action: 'Add tile to the map (edges must match)' },
      { phase: '3. Deploy', action: 'Optionally place 1 meeple on the new tile' },
      { phase: '4. Score', action: 'Score any completed features' },
    ],
    keyRules: [
      { rule: 'Matching edges', detail: 'Roads to roads, cities to cities, fields to fields' },
      { rule: 'Meeple placement', detail: 'Only on tile just placed, not in occupied features' },
      { rule: 'Scoring returns', detail: 'Meeples return after completed features score' },
      { rule: 'Fields', detail: 'Meeples stay until game end, score 3 per completed city' },
      { rule: 'Majority wins', detail: 'Ties share points equally' },
    ],
    costs: [
      { item: 'Road complete', cost: '1 point per tile' },
      { item: 'City complete', cost: '2 points per tile + 2 per pennant' },
      { item: 'Monastery complete', cost: '9 points (all 8 surrounding + center)' },
      { item: 'Incomplete road', cost: '1 point per tile at game end' },
      { item: 'Incomplete city', cost: '1 point per tile + 1 per pennant at game end' },
      { item: 'Fields', cost: '3 points per completed city touching field' },
    ],
    quickReminders: [
      'Save meeples - can\'t place if none available',
      'Fields are powerful but risky (game-long commitment)',
      'Connect to opponents\' features to share/steal points',
      'Score track: 50+ = flip meeple to indicate +50',
    ],
    endGame: 'Last tile placed, then score all incomplete features and fields. Highest score wins.',
  },
  '7-wonders': {
    turnSummary: [
      { phase: '1. Choose', action: 'Select 1 card from hand simultaneously' },
      { phase: '2. Reveal', action: 'All reveal chosen cards together' },
      { phase: '3. Build', action: 'Pay cost OR build wonder stage OR sell for 3 coins' },
      { phase: '4. Pass', action: 'Pass remaining cards to neighbor' },
    ],
    keyRules: [
      { rule: 'Resource trading', detail: '2 coins per resource from neighbors' },
      { rule: 'Chain building', detail: 'Symbol on card = free prerequisite' },
      { rule: 'Military', detail: 'Compare shields at end of each age' },
      { rule: 'Science scoring', detail: 'Sets of 3 + squares of matching symbols' },
      { rule: 'Yellow cards', detail: 'Often provide coins or trading discounts' },
    ],
    costs: [
      { item: 'Age I military', cost: '+1/-1 tokens' },
      { item: 'Age II military', cost: '+3/-1 tokens' },
      { item: 'Age III military', cost: '+5/-1 tokens' },
      { item: 'Buy neighbor resource', cost: '2 coins each' },
      { item: 'Discard card', cost: 'Gain 3 coins' },
      { item: 'Wonder stage', cost: 'Pay wonder cost, tuck any card' },
    ],
    quickReminders: [
      'Pass left in Ages I & III, right in Age II',
      'Science: set of 3 different = 7 points',
      'Science: each matching symbol = symbol² points',
      'Can only build 1 of each card (by name)',
    ],
    endGame: 'After Age III military. Sum all victory points. Most points wins.',
  },
  dominion: {
    turnSummary: [
      { phase: 'Action Phase', action: 'Play 1 Action card (more with +Actions)' },
      { phase: 'Buy Phase', action: 'Play Treasures, buy 1 card (more with +Buys)' },
      { phase: 'Cleanup', action: 'Discard everything, draw 5 new cards' },
    ],
    keyRules: [
      { rule: 'Starting deck', detail: '7 Copper, 3 Estate = 10 cards' },
      { rule: '+Actions', detail: 'Lets you play additional Action cards' },
      { rule: '+Cards', detail: 'Draw more cards from your deck' },
      { rule: '+Buys', detail: 'Lets you buy multiple cards' },
      { rule: 'Trash', detail: 'Remove cards permanently from your deck' },
    ],
    costs: [
      { item: 'Copper', cost: '0 (value 1)' },
      { item: 'Silver', cost: '3 (value 2)' },
      { item: 'Gold', cost: '6 (value 3)' },
      { item: 'Estate', cost: '2 (1 VP)' },
      { item: 'Duchy', cost: '5 (3 VP)' },
      { item: 'Province', cost: '8 (6 VP)' },
    ],
    quickReminders: [
      'Bought cards go to discard, not hand',
      'Shuffle discard when deck is empty',
      'Victory cards are dead draws mid-game',
      'Game ends when Provinces or 3 piles empty',
    ],
    endGame: 'Province pile empty OR any 3 supply piles empty. Count all VP in deck.',
  },
  'king-of-tokyo': {
    turnSummary: [
      { phase: '1. Roll', action: 'Roll 6 dice, reroll up to 2 more times' },
      { phase: '2. Resolve', action: 'Apply all dice results' },
      { phase: '3. Enter Tokyo', action: 'If empty and you rolled claws, enter' },
      { phase: '4. Buy', action: 'Spend energy on Power cards' },
    ],
    keyRules: [
      { rule: 'In Tokyo', detail: 'Attack ALL others, cannot heal, +2 VP per turn' },
      { rule: 'Yield', detail: 'When hit while in Tokyo, may leave (attacker enters)' },
      { rule: 'Elimination', detail: '0 health = out of the game' },
      { rule: 'Sweep', detail: 'Pay 2 energy to discard all 3 face-up cards, reveal new' },
    ],
    costs: [
      { item: 'Claw', cost: '1 damage per claw' },
      { item: 'Heart', cost: 'Heal 1 (not in Tokyo)' },
      { item: 'Lightning', cost: '1 energy per lightning' },
      { item: '3 matching numbers', cost: 'That many VP' },
      { item: 'Extra matching die', cost: '+1 VP each' },
    ],
    quickReminders: [
      'First to Tokyo gets 1 VP for entering',
      'Start of turn in Tokyo = 2 VP',
      'Cannot heal inside Tokyo',
      'Power cards stay unless discarded',
    ],
    endGame: 'First to 20 VP wins, OR last monster standing.',
  },
  'sushi-go': {
    turnSummary: [
      { phase: '1. Pick', action: 'Choose 1 card from hand, place face-down' },
      { phase: '2. Reveal', action: 'All flip cards simultaneously' },
      { phase: '3. Pass', action: 'Pass remaining hand to the left' },
      { phase: 'Repeat', action: 'Continue until all cards played' },
    ],
    keyRules: [
      { rule: 'Chopsticks', detail: 'Say "Sushi Go!" to swap for 2 cards later' },
      { rule: 'Wasabi', detail: 'Next nigiri played on it is tripled' },
      { rule: 'Pudding', detail: 'Keep until game end, scored after round 3' },
      { rule: 'Rounds', detail: 'Play 3 rounds, reshuffle between rounds' },
    ],
    costs: [
      { item: 'Tempura', cost: '5 pts per pair (0 for 1)' },
      { item: 'Sashimi', cost: '10 pts per set of 3 (0 for 1-2)' },
      { item: 'Dumplings', cost: '1/3/6/10/15 for 1-5+' },
      { item: 'Maki (most/2nd)', cost: '6/3 VP' },
      { item: 'Nigiri (egg/salmon/squid)', cost: '1/2/3 VP' },
    ],
    quickReminders: [
      'Pudding: most = +6, least = -6 at game end',
      'Chopsticks: put back in hand after using',
      'Maki: count icons, not cards',
      'Wasabi + Squid = 9 points!',
    ],
    endGame: 'After 3 rounds. Score puddings, highest total wins.',
  },
  'love-letter': {
    turnSummary: [
      { phase: '1. Draw', action: 'Draw 1 card (now have 2)' },
      { phase: '2. Play', action: 'Play 1 card and resolve its effect' },
    ],
    keyRules: [
      { rule: 'Protection', detail: 'Handmaid makes you immune until your next turn' },
      { rule: 'Forced play', detail: 'Countess MUST be played if you have King or Prince' },
      { rule: 'Princess', detail: 'If discarded for any reason, you are eliminated' },
      { rule: 'Compare ties', detail: 'On Baron tie, neither player is eliminated' },
    ],
    costs: [
      { item: 'Guard (1)', cost: 'Guess hand, eliminate if correct' },
      { item: 'Priest (2)', cost: 'Look at opponent hand' },
      { item: 'Baron (3)', cost: 'Compare hands, lower loses' },
      { item: 'Handmaid (4)', cost: 'Protection until next turn' },
      { item: 'Prince (5)', cost: 'Target discards hand, draws new' },
      { item: 'King (6)', cost: 'Trade hands with opponent' },
    ],
    quickReminders: [
      'Cannot guess Guard with Guard',
      'Handmaid protects but announces weakness',
      'Track played cards to deduce hands',
      'If deck runs out, highest card wins',
    ],
    endGame: 'One player left OR deck empty (highest card wins round).',
  },
  'the-crew': {
    turnSummary: [
      { phase: 'Lead', action: 'Leader plays any card' },
      { phase: 'Follow', action: 'Must follow suit if able' },
      { phase: 'Win', action: 'Highest card of led suit (or trump) wins' },
      { phase: 'Next', action: 'Winner leads next trick' },
    ],
    keyRules: [
      { rule: 'Trump', detail: 'Rockets (1-4) always beat non-rockets' },
      { rule: 'Follow suit', detail: 'Must play same color if possible' },
      { rule: 'Communication', detail: '1 card face-up + token (highest/lowest/only)' },
      { rule: 'Tasks', detail: 'Specific player must win specific card' },
    ],
    costs: [
      { item: 'Token on top', cost: 'This is my HIGHEST of this suit' },
      { item: 'Token on bottom', cost: 'This is my LOWEST of this suit' },
      { item: 'Token in center', cost: 'This is my ONLY card of this suit' },
      { item: 'Order token', cost: 'Must complete tasks in this sequence' },
    ],
    quickReminders: [
      'Discuss strategy BEFORE dealing',
      'Once dealt, only communicate via tokens',
      'Commander (4 of rockets) leads first',
      'All tasks must succeed for mission success',
    ],
    endGame: 'All tasks completed = win! Any task failed = retry mission.',
  },
  cascadia: {
    turnSummary: [
      { phase: '1. Draft', action: 'Take 1 tile + paired token (or use nature token)' },
      { phase: '2. Place tile', action: 'Add tile adjacent to your ecosystem' },
      { phase: '3. Place wildlife', action: 'Put token on matching habitat (optional)' },
      { phase: '4. Refill', action: 'Draw new tile + token for display' },
    ],
    keyRules: [
      { rule: 'Nature tokens', detail: 'Take ANY tile with ANY token' },
      { rule: 'Overpopulation', detail: '4+ same wildlife tokens = refresh all' },
      { rule: 'Habitat corridors', detail: 'Largest contiguous habitat scores bonus' },
      { rule: 'Wildlife placement', detail: 'Only on spaces showing that animal' },
    ],
    costs: [
      { item: 'Nature token', cost: 'Free draft OR earn by completing habitat' },
      { item: 'Habitat corridor', cost: '0/1/2/3/5/8/12/15+ tiles = VP' },
      { item: 'Wildlife scoring', cost: 'Per scoring card chosen at setup' },
      { item: 'Leftover nature tokens', cost: '1 VP each' },
    ],
    quickReminders: [
      'Check scoring cards - each game is different',
      'Larger habitats = bigger bonuses',
      'Wildlife tokens cannot move once placed',
      'Nature tokens are flexible - save for key moments',
    ],
    endGame: 'All tiles placed (20 turns). Score wildlife + habitats + nature tokens.',
  },
}

// Default reference content
const defaultReferenceContent: LegacyReferenceContent = {
  turnSummary: [
    { phase: 'Your Turn', action: 'See rulebook for turn structure.' },
  ],
  keyRules: [
    { rule: 'See rulebook', detail: 'Full reference coming soon.' },
  ],
  costs: [
    { item: 'See rulebook', cost: '-' },
  ],
  quickReminders: ['Refer to the official rulebook for key rules.'],
  endGame: 'See rulebook for end game conditions.',
}

export default async function ReferencePage({ params }: ReferencePageProps) {
  const { slug } = await params
  const game = await getGameBySlug(slug)

  if (!game || !game.has_reference) {
    notFound()
  }

  // Prefer database content, fall back to hardcoded content
  const content: ReferenceContent = (game.reference_content as unknown as ReferenceContent) || referenceContent[game.slug] || defaultReferenceContent
  const isAI = isAIContent(content)

  return (
    <div className="container py-8 md:py-12">
      {/* Breadcrumb & Back */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <nav className="text-sm text-muted-foreground">
          <Link href="/games" className="hover:text-foreground">
            Games
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/games/${game.slug}`} className="hover:text-foreground">
            {game.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Reference</span>
        </nav>
        <div className="flex items-center gap-2">
          <PrintButton />
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/games/${game.slug}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6 print:mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 print:hidden">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl print:text-2xl">
              {game.name} Quick Reference
            </h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground print:hidden">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {game.player_count_min}-{game.player_count_max} players
              </span>
              {game.play_time_min && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {game.play_time_min}-{game.play_time_max} min
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reference Cards Grid - Optimized for printing */}
      <div className="grid gap-4 md:grid-cols-2 print:grid-cols-2 print:gap-3">
        {/* Turn Summary */}
        <Card className="print:break-inside-avoid print:shadow-none print:border">
          <CardHeader className="pb-2 print:pb-1">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-white text-xs font-bold">
                1
              </span>
              Turn Structure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {isAI ? (
                (content as AIReferenceContent).turnSummary.map((item, i) => (
                  <div key={i} className="text-sm text-muted-foreground print:text-gray-600">
                    • {item}
                  </div>
                ))
              ) : (
                (content as LegacyReferenceContent).turnSummary.map((item, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-medium text-primary">
                      {item.phase}:
                    </span>{' '}
                    <span className="text-muted-foreground print:text-gray-600">
                      {item.action}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Key Rules / Actions */}
        <Card className="print:break-inside-avoid print:shadow-none print:border">
          <CardHeader className="pb-2 print:pb-1">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-white text-xs font-bold">
                2
              </span>
              {isAI ? 'Actions' : 'Key Rules'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {isAI ? (
                (content as AIReferenceContent).actions.map((item, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-medium">{item.name}:</span>{' '}
                    <span className="text-muted-foreground print:text-gray-600">
                      {item.effect} ({item.cost})
                    </span>
                  </div>
                ))
              ) : (
                (content as LegacyReferenceContent).keyRules.map((item, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-medium">{item.rule}:</span>{' '}
                    <span className="text-muted-foreground print:text-gray-600">
                      {item.detail}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Costs/Scoring */}
        <Card className="print:break-inside-avoid print:shadow-none print:border">
          <CardHeader className="pb-2 print:pb-1">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-white text-xs font-bold">
                3
              </span>
              {isAI ? 'Scoring' : 'Costs & Points'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody>
                {isAI ? (
                  (content as AIReferenceContent).scoring.map((item, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-1">{item.category}</td>
                      <td className="py-1 text-right font-medium text-muted-foreground print:text-gray-600">
                        {item.points}
                      </td>
                    </tr>
                  ))
                ) : (
                  (content as LegacyReferenceContent).costs.map((item, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-1">{item.item}</td>
                      <td className="py-1 text-right font-medium text-muted-foreground print:text-gray-600">
                        {item.cost}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Quick Reminders + End Game / Important Numbers */}
        <Card className="print:break-inside-avoid print:shadow-none print:border">
          <CardHeader className="pb-2 print:pb-1">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-white text-xs font-bold">
                4
              </span>
              {isAI ? 'Key Numbers & Reminders' : 'Remember'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isAI ? (
              <>
                {(content as AIReferenceContent).importantNumbers && (
                  <div className="space-y-1 text-sm">
                    {(content as AIReferenceContent).importantNumbers.map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-muted-foreground">{item.what}</span>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                )}
                <Separator className="print:hidden" />
                <ul className="space-y-1 text-sm">
                  {(content as AIReferenceContent).reminders.map((reminder, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span className="text-muted-foreground print:text-gray-600">
                        {reminder}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <ul className="space-y-1 text-sm">
                  {(content as LegacyReferenceContent).quickReminders.map((reminder, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span className="text-muted-foreground print:text-gray-600">
                        {reminder}
                      </span>
                    </li>
                  ))}
                </ul>
                <Separator className="print:hidden" />
                <div className="text-sm">
                  <span className="font-medium text-primary">
                    End Game:
                  </span>{' '}
                  <span className="text-muted-foreground print:text-gray-600">
                    {(content as LegacyReferenceContent).endGame}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar on screen, hidden when printing */}
      <div className="mt-8 print:hidden">
        <Separator className="mb-8" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {game.has_rules && (
            <Button variant="outline" className="justify-start" asChild>
              <Link href={`/games/${game.slug}/rules`}>
                Full Rules Summary
              </Link>
            </Button>
          )}
          {game.has_score_sheet && (
            <Button variant="outline" className="justify-start" asChild>
              <Link href={`/games/${game.slug}/score-sheet`}>
                Score Sheet
              </Link>
            </Button>
          )}
          {game.has_setup_guide && (
            <Button variant="outline" className="justify-start" asChild>
              <Link href={`/games/${game.slug}/setup`}>
                Setup Guide
              </Link>
            </Button>
          )}
          {game.bgg_id && (
            <Button variant="outline" className="justify-start gap-2" asChild>
              <a
                href={`https://boardgamegeek.com/boardgame/${game.bgg_id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                BGG Page
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
