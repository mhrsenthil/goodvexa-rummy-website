
/*
 GOODVEXA RUMMY
 Rummy Rules Engine
 13-card Indian Rummy validation
*/

(function () {
  "use strict";

  // அட்டை Sequence ஆக உள்ளதா என்று சரிபார்க்கும்
  function checkSequence(cards) {
    if (cards.length < 3) return null;

    const jokers = cards.filter(card => card.joker);
    const normal = cards.filter(card => !card.joker);

    if (normal.length === 0) return null;

    const suit = normal[0].suit;

    // எல்லா சாதாரண அட்டைகளும் ஒரே Suit ஆக இருக்க வேண்டும்
    if (!normal.every(card => card.suit === suit)) {
      return null;
    }

    // ஒரே Rank இரண்டு முறை வரக்கூடாது
    for (let i = 0; i < normal.length; i++) {
      for (let j = i + 1; j < normal.length; j++) {
        if (normal[i].rank === normal[j].rank) {
          return null;
        }
      }
    }

    // Ace-ஐ 1 அல்லது 14 ஆகப் பயன்படுத்தலாம்
    const length = cards.length;

    for (let start = 1; start <= 14 - length + 1; start++) {
      const ranks = normal.map(card => {
        if (card.rank === 1 && start > 1) return 14;
        return card.rank;
      });

      const valid = ranks.every(rank =>
        rank >= start && rank < start + length
      );

      if (valid) {
        return {
          type: jokers.length === 0
            ? "Pure Sequence"
            : "Impure Sequence",
          pure: jokers.length === 0,
          cards: cards
        };
      }
    }

    return null;
  }

  // அட்டைகள் Set ஆக உள்ளதா என்று சரிபார்க்கும்
  function checkSet(cards) {
    if (cards.length < 3 || cards.length > 4) {
      return null;
    }

    const normal = cards.filter(card => !card.joker);
    const jokers = cards.filter(card => card.joker);

    if (normal.length === 0) return null;

    const rank = normal[0].rank;

    // எல்லா சாதாரண அட்டைகளும் ஒரே Rank ஆக இருக்க வேண்டும்
    if (!normal.every(card => card.rank === rank)) {
      return null;
    }

    // ஒரே Suit இரண்டு முறை வரக்கூடாது
    const suits = normal.map(card => card.suit);

    if (new Set(suits).size !== suits.length) {
      return null;
    }

    return {
      type: "Set",
      pure: false,
      cards: cards
    };
  }

  // 13 அட்டைகளையும் சரிபார்க்கும் முக்கிய Function
  function checkRummyHand(hand) {
    if (!Array.isArray(hand) || hand.length !== 13) {
      return {
        valid: false,
        message: "சரியாக 13 அட்டைகள் தேவை.",
        groups: []
      };
    }

    const candidates = [];
    const total = hand.length;

    // எல்லா சாத்தியமான அட்டைக் குழுக்களையும் உருவாக்குதல்
    for (let mask = 1; mask < (1 << total); mask++) {
      const group = [];

      for (let i = 0; i < total; i++) {
        if (mask & (1 << i)) {
          group.push(hand[i]);
        }
      }

      if (group.length < 3) continue;

      const sequence = checkSequence(group);
      const set = checkSet(group);

      if (sequence) {
        candidates.push({
          mask,
          type: sequence.type,
          pure: sequence.pure,
          cards: group
        });
      }

      if (set) {
        candidates.push({
          mask,
          type: set.type,
          pure: false,
          cards: group
        });
      }
    }

    // ஒவ்வொரு அட்டையும் ஒரே ஒரு குழுவில் மட்டுமே இருக்க வேண்டும்
    const memo = new Map();

    function findGroups(remaining, sequenceCount, pureCount) {
      if (remaining === 0) {
        if (sequenceCount >= 2 && pureCount >= 1) {
          return [];
        }
        return null;
      }

      const key = remaining + "|" +
        sequenceCount + "|" + pureCount;

      if (memo.has(key)) return null;

      // மீதமுள்ள முதல் அட்டையைத் தேர்வு செய்
      let firstBit = 0;

      for (let i = 0; i < total; i++) {
        if (remaining & (1 << i)) {
          firstBit = 1 << i;
          break;
        }
      }

      for (const candidate of candidates) {
        if (!(candidate.mask & firstBit)) continue;

        // ஏற்கெனவே பயன்படுத்திய அட்டைகளை மீண்டும் பயன்படுத்தக்கூடாது
        if ((candidate.mask & remaining) !== candidate.mask) {
          continue;
        }

        const isSequence =
          candidate.type === "Pure Sequence" ||
          candidate.type === "Impure Sequence";

        const nextSequence = Math.min(
          2,
          sequenceCount + (isSequence ? 1 : 0)
        );

        const nextPure = Math.min(
          1,
          pureCount + (candidate.pure ? 1 : 0)
        );

        const result = findGroups(
          remaining ^ candidate.mask,
          nextSequence,
          nextPure
        );

        if (result !== null) {
          return [candidate, ...result];
        }
      }

      memo.set(key, false);
      return null;
    }

    const groups = findGroups(
      (1 << total) - 1,
      0,
      0
    );

    if (groups === null) {
      return {
        valid: false,
        message: "சரியான Rummy அமைப்பு இல்லை. குறைந்தது 2 Sequence மற்றும் 1 Pure Sequence தேவை.",
        groups: []
      };
    }

    return {
      valid: true,
      message: "வாழ்த்துகள்! நீங்கள் Rummy வெற்றி பெற்றுள்ளீர்கள்!",
      groups: groups.map(group => ({
        type: group.type,
        cards: group.cards
      }))
    };
  }

  // மற்ற JavaScript கோப்புகளிலிருந்து பயன்படுத்த
  window.checkRummyHand = checkRummyHand;

})();
