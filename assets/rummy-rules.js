/* GOODVEXA RUMMY: shared 13-card Indian Rummy rules and deck helpers. */
(function (root) {
  "use strict";

  const SUITS = [
    { symbol: "♠", red: false },
    { symbol: "♥", red: true },
    { symbol: "♦", red: true },
    { symbol: "♣", red: false }
  ];

  function cardKey(card) {
    return card && card.id ? card.id : card;
  }

  function isValidCard(card) {
    return Boolean(card && (card.joker
      ? card.suit === "★" && card.rank === 0
      : ["♠", "♥", "♦", "♣"].includes(card.suit) && Number.isInteger(card.rank) && card.rank >= 1 && card.rank <= 13));
  }

  function hasDuplicateCards(cards) {
    const ids = new Set();
    const faces = new Set();
    for (const card of cards) {
      if (!isValidCard(card)) return true;
      const identity = cardKey(card);
      if (ids.has(identity)) return true;
      ids.add(identity);
      if (!card.joker) {
        const face = `${card.suit}:${card.rank}`;
        if (faces.has(face)) return true;
        faces.add(face);
      }
    }
    return cards.filter(card => card.joker).length > 2;
  }

  function createDeck(random = Math.random) {
    const cards = [];
    SUITS.forEach(suit => {
      for (let rank = 1; rank <= 13; rank++) {
        cards.push({ id: `${suit.symbol}-${rank}`, suit: suit.symbol, rank, red: suit.red, joker: false });
      }
    });
    cards.push({ id: "joker-1", suit: "★", rank: 0, red: false, joker: true });
    cards.push({ id: "joker-2", suit: "★", rank: 0, red: true, joker: true });

    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
  }

  function classifyGroup(cards) {
    if (!Array.isArray(cards) || cards.length < 3 || cards.length > 13 || hasDuplicateCards(cards)) return null;
    const jokers = cards.filter(card => card && card.joker);
    const natural = cards.filter(card => card && !card.joker);
    if (natural.length + jokers.length !== cards.length || natural.length === 0) return null;

    // A sequence is one suit with distinct ranks; aces can be low or high.
    if (natural.every(card => card.suit === natural[0].suit) &&
        new Set(natural.map(card => card.rank)).size === natural.length) {
      for (let start = 1; start + cards.length - 1 <= 14; start++) {
        const ranks = natural.map(card => card.rank === 1 && start > 1 ? 14 : card.rank);
        if (ranks.every(rank => rank >= start && rank < start + cards.length)) {
          return { type: jokers.length ? "Impure Sequence" : "Pure Sequence", pure: jokers.length === 0 };
        }
      }
    }

    // A set has one rank, distinct natural suits, and at most four cards.
    if (cards.length <= 4 && new Set(natural.map(card => card.rank)).size === 1 &&
        new Set(natural.map(card => card.suit)).size === natural.length) {
      return { type: "Set", pure: false };
    }
    return null;
  }

  function validateGroup(cards) {
    const group = classifyGroup(cards);
    return group
      ? { valid: true, type: group.type, pure: group.pure, message: `${group.type} is valid.` }
      : { valid: false, type: "Invalid", pure: false, message: "Cards must form a valid sequence or set." };
  }

  function enumerateGroups(hand) {
    const groups = [];
    const fullMask = (1 << hand.length) - 1;
    for (let mask = 1; mask <= fullMask; mask++) {
      const cards = [];
      for (let i = 0; i < hand.length; i++) if (mask & (1 << i)) cards.push(hand[i]);
      const result = classifyGroup(cards);
      if (result) groups.push({ mask, type: result.type, pure: result.pure, cards });
    }
    return groups;
  }

  function findArrangement(hand) {
    const candidates = enumerateGroups(hand);
    const byCard = Array.from({ length: hand.length }, (_, index) =>
      candidates.filter(group => group.mask & (1 << index))
    );
    const failed = new Set();

    function search(remaining, sequences, hasPure) {
      if (remaining === 0) return sequences >= 2 && hasPure ? [] : null;
      const key = `${remaining}:${Math.min(sequences, 2)}:${hasPure ? 1 : 0}`;
      if (failed.has(key)) return null;
      let first = 0;
      while (!(remaining & (1 << first))) first++;

      for (const group of byCard[first]) {
        if ((group.mask & remaining) !== group.mask) continue;
        const isSequence = group.type.endsWith("Sequence");
        const result = search(remaining ^ group.mask, Math.min(2, sequences + Number(isSequence)), hasPure || group.pure);
        if (result) return [group, ...result];
      }
      failed.add(key);
      return null;
    }

    return search((1 << hand.length) - 1, 0, false);
  }

  function validateHand(hand) {
    if (!Array.isArray(hand) || hand.length !== 13) {
      return { valid: false, message: "A valid declaration requires exactly 13 cards.", groups: [] };
    }
    if (hasDuplicateCards(hand)) {
      return { valid: false, message: "The hand must contain 13 distinct cards.", groups: [] };
    }
    const arrangement = findArrangement(hand);
    if (!arrangement) {
      return { valid: false, message: "Arrange all 13 cards into valid groups, including at least two sequences and one pure sequence.", groups: [] };
    }
    return {
      valid: true,
      message: "Valid Rummy declaration.",
      groups: arrangement.map(group => ({ type: group.type, cards: group.cards }))
    };
  }

  function validateDeclaredGroups(groups, hand) {
    if (!Array.isArray(groups) || groups.some(group => !Array.isArray(group)) ||
        !Array.isArray(hand) || hand.length !== 13 || hasDuplicateCards(hand)) {
      return { valid: false, message: "A valid declaration requires exactly 13 cards in groups." };
    }
    const groupedCards = groups.flat();
    const groupedKeys = groupedCards.map(card => card && cardKey(card));
    const handKeys = hand.map(cardKey);
    if (groupedCards.length !== 13 || hasDuplicateCards(groupedCards) || new Set(groupedKeys).size !== 13 ||
        handKeys.some(key => !groupedKeys.includes(key)) ||
        groupedKeys.some(key => !handKeys.includes(key))) {
      return { valid: false, message: "Place all 13 cards into groups exactly once." };
    }
    const results = groups.map(validateGroup);
    if (results.some(result => !result.valid)) return { valid: false, message: "Every group must be a valid sequence or set." };
    const sequences = results.filter(result => result.type.endsWith("Sequence"));
    if (sequences.length < 2 || !sequences.some(result => result.pure)) {
      return { valid: false, message: "At least two sequences are required, including one pure sequence." };
    }
    return {
      valid: true,
      message: "Valid Rummy declaration.",
      groups: results.map((result, index) => ({ ...result, cards: groups[index] }))
    };
  }

  const engine = { createDeck, classifyGroup, validateGroup, validateHand, validateDeclaredGroups };
  root.RummyEngine = engine;
  // Keep the original entry points available to existing pages and integrations.
  root.checkRummyHand = validateHand;
  root.checkRummyGroup = validateGroup;
  root.checkDeclaredGroups = validateDeclaredGroups;
})(window);
