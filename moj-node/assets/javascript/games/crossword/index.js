// var options = {
//   dimensions: { x: 20, y: 20 },
//   wordList: [
//     'hugh',
//     'pugh',
//     'barney',
//     'mcgrue',
//     'cuthbert',
//     'dibble',
//     'grub',
//     'windy',
//     'trumpton',
//     'television',
//     'windmill'
//   ]
// };

var options = {
  dimensions: { x: 20, y: 20 },
  wordList: [
    'elephant',
    'zebra',
    'parrot',
    'monkey',
    'dog',
    'cat',
    'octopus',
    'llama',
    'gorilla',
    'fish',
    'sloth',
    'orangutan',
    'whale',
    'pheasant',
    'alpaca',
    'mouse',
    'tarantula'
  ]
};

var directions = {
  ACROSS: 'across',
  DOWN: 'down'
};

function WordGrid(options) {

  var size = options.dimensions;
  var words = [];
  var numberOfPlacedWords = 0;
  var grid = [];

  function createGrid(dimensions) {
    var grid = [];
    for (var yPos = 0; yPos < dimensions.y; yPos++) {
      var row = [];
      for (var xPos = 0; xPos < dimensions.x; xPos++) {
        row.push('');
      }
      grid.push(row);
    }
    return grid;
  }

  function placeWord(word, x, y, isVertical) {
    if (isVertical) {
      for (var yOffset = 0; yOffset < word.length; yOffset++) {
        grid[y + yOffset][x] = word[yOffset];
      }
    } else {
      for (var xOffset = 0; xOffset < word.length; xOffset++) {
        grid[y][x + xOffset] = word[xOffset];
      }
    }

    words.push({
      number: numberOfPlacedWords,
      direction: isVertical ? directions.DOWN : directions.ACROSS,
      row: y,
      column: x,
      clue: 'It might be a ' + word,
      answer: word
    });

    numberOfPlacedWords++;
  }

  function addFirstWord(word) {
    var start = Math.floor(options.dimensions.x / 2);
    var offset = Math.floor(word.length / 2);
    var index = start - offset;
    if (index < 0) {
      return false;
    }
    placeWord(word, start, index, true);
    return true;
  }

  function getLettersFor(word) {
    var letters = [];
    var middleOfWord = Math.floor(word.length / 2) - 1;

    for (var i = 0; i < word.length; i++) {
      var offset;
      if (i % 2) {
        offset = Math.ceil(i / 2);
      } else {
        offset = i * -0.5;
      }

      var index = middleOfWord + offset;
      if (!word[index]) {
        index = word.length - 1;
      }
      letters.push({
        letter: word[index],
        index: index
      });
    }

    return letters;
  }

  function hasRowAbove(y, offset) {
    offset = offset || 1;
    if (grid[y - offset]) {
      return true;
    } else {
      console.log('No row above', y, offset);
      return false;
    }
  }

  function hasRowBelow(y, offset) {
    offset = offset || 1;
    if (grid[y + offset]) {
      return true;
    } else {
      console.log('No row below', y, offset);
      return false;
    }
  }

  function rowExists(y, yOffset) {
    yOffset = yOffset || 0;
    if (grid[y + yOffset]) {
      return true;
    } else {
      console.log('Row does not exist', y);
      return false;
    }
  }

  function isEmptyAtPosition(x, y, xOffset, yOffset) {
    xOffset = xOffset || 0;
    yOffset = yOffset || 0;
    if (grid[y + yOffset][x + xOffset] === '') {
      return true;
    } else {
      console.log('Cell not empty at position', x + xOffset, y + yOffset);
      return false;
    }
  }

  function hasLetterAtPosition(x, y, xOffset, yOffset, letter) {
    xOffset = xOffset || 0;
    yOffset = yOffset || 0;
    if (grid[y + yOffset][x + xOffset] === letter) {
      return true;
    } else {
      console.log('Letter mismatch at position', x + xOffset, y + yOffset, letter);
      return false;
    }
  }


  function checkWordPosition(word, x, y, isVertical) {
    console.log('Checking position', word, x, y)
    if (isVertical) {
      for (var i = -1; i < word.length + 1; i++) {
        console.log('checking', x, y + i);
        if (!rowExists(y, i) || (!isEmptyAtPosition(x, y, null, i) && !hasLetterAtPosition(x, y, null, i, word[i])) ||
          ((!isEmptyAtPosition(x, y, 1, i) || !isEmptyAtPosition(x, y, -1, i)) && !hasLetterAtPosition(x, y, null, i, word[i]))) {
          return false;
        }
      }
    } else {
      1
      for (var i = -1; i < word.length + 1; i++) {
        console.log('checking', x + i, y);
        if (!hasRowBelow(y) || !hasRowAbove(y) || (!isEmptyAtPosition(x, y, i) && !hasLetterAtPosition(x, y, i, null, word[i])) ||
          ((!isEmptyAtPosition(x, y, i, 1) || !isEmptyAtPosition(x, y, i, -1)) && !hasLetterAtPosition(x, y, i, null, word[i]))) {
          return false;
        }
      }
    }
    return true;
  }

  function fitWordByLetterPositionV(index, word, x, y) {
    console.log('vertical');
    var position;

    if ((!hasRowAbove(y) || isEmptyAtPosition(x, y, null, -1)) && (!hasRowBelow(y) || isEmptyAtPosition(x, y, null, 1))) {
      if (checkWordPosition(word, x, y - index, true)) {
        position = {
          x: x,
          y: y - index,
          isVertical: true
        };
      }
    }

    if ((!rowExists(y) || isEmptyAtPosition(x, y, -1)) && (!rowExists(y) || isEmptyAtPosition(x, y, 1))) {
      if (checkWordPosition(word, x - index, y)) {
        console.log(word);
        position = {
          x: x - index,
          y: y,
          isVertical: false
        };
      }
    }

    if (position) {
      return position;
    }
    console.log('Invalid position', word, x, y);
    return false;
  }

  function fitWordByLetterPositionH(index, word, x, y) {
    console.log('horizontal');
    var position;

    if (isEmptyAtPosition(x, y, -1) && isEmptyAtPosition(x, y, 1)) {
      if (checkWordPosition(word, x - index, y)) {
        position = {
          x: x - index,
          y: y,
          isVertical: false
        };
      }
    }

    if (isEmptyAtPosition(x, y, null, -1) && isEmptyAtPosition(x, y, null)) {
      if (checkWordPosition(word, x, y - index, true)) {
        position = {
          x: x,
          y: y - index,
          isVertical: true
        };
      }
    }

    if (position) {
      return position;
    }
    console.log('Invalid position', word, x, y);
    return false;
  }

  function findLetterInRow(index, word, y) {
    for (var x = 0; x < grid[y].length; x++) {
      var cell = grid[y][x];
      if (cell === word[index]) {
        console.log('match!', cell, word, x, y, index);
        var position;
        // if (numberOfPlacedWords % 2) {
        //     position = fitWordByLetterPositionH(index, word, x, y);
        // } else {
        //     position = fitWordByLetterPositionV(index, word, x, y);
        // }
        position = fitWordByLetterPositionH(index, word, x, y);
        if (!position) {
          position = fitWordByLetterPositionV(index, word, x, y);
        }

        if (position) {
          return position;
        }
      }
    }
    return false;
  }

  function findPositionFor(letters, word) {
    var rows = [];

    for (var i = 0; i < size.y; i++) {
      rows.push(i);
    }

    if (word.length % 2 !== 0) {
      rows.reverse();
    }

    for (var r of rows) {
      for (var l of letters) {
        var position = findLetterInRow(l.index, word, r);
        if (position) {
          return position;
        }
      }
    }
  }

  function addWord(word) {
    var letters = getLettersFor(word);
    var position = findPositionFor(letters, word);

    if (position) {
      placeWord(word, position.x, position.y, position.isVertical);
      return true;
    }

    console.warn('Crossword: could not place word "' + word + '"');
    return false;
  }

  function sortWords(wordList) {
    wordList.sort(function (first, second) { return second.length - first.length; });
  }

  function addWords(wordList) {
    sortWords(wordList);
    console.log(wordList);
    addFirstWord(wordList.shift());

    var wordsChecked = 0;
    while (wordList.length) {
      if (wordsChecked === wordList.length) {
        break;
      }

      if (wordList[0].length < 2) {
        wordList.shift();
        continue;
      }

      if (!addWord(wordList[0])) {
        wordList.splice(1, 0, wordList.shift());
        wordsChecked++;
      } else {
        wordList.shift();
        wordsChecked = 0;
      }
    }

    if (wordList.length) {
      console.warn('Crossword: Unable to place all words');
    }
  }

  grid = createGrid(size);
  addWords(options.wordList)

  return {
    renderGrid: function () {
      function padToTwo(number) {
        if (number <= 9999) { number = ("00" + number).slice(-2); }
        return number;
      }
      var rendered = '[ +]';
      for (var y = 0; y < grid.length; y++) {

        rendered += '[' + padToTwo(y) + ']';
      }
      rendered += '\n';
      for (var y = 0; y < grid.length; y++) {
        rendered += '[' + padToTwo(y) + ']';
        for (var x = 0; x < grid[y].length; x++) {
          rendered += grid[y][x] === '' ? '[  ]' : '[ ' + grid[y][x] + ']';
        }
        rendered += '\n';
      }
      return rendered;
    },
    getGrid: function () { return grid; },
    getWords: function () { return words; }

  };

}

function CrosswordGame(wordGrid) {

  var grid = wordGrid.getGrid();
  var words = wordGrid.getWords();

  function getGameBoard() {
    return $('#crossword-board');
  }

  function findCellAtPosition(x, y) {
    return getGameBoard().find('.crossword__row').eq(y).find('.crossword__cell').eq(x);
  }

  function createWordSelectionHandler(wordId, number, direction) {
    return function () {
      var word = words[wordId];
      findCellAtPosition(word.column, word.row).find('input').focus();
      var board = getGameBoard();
      board.find('.crossword__cell__input').removeClass('crossword__cell__input--selected');
      board.find('[data-' + direction + '=' + number + ']').addClass('crossword__cell__input--selected');
    }
  }

  function clearHighlighting() {
    getGameBoard().find('.crossword__cell__input').removeClass('crossword__cell__input--selected');
  }

  function createClue(number, word) {
    var clue = $('<li class="crossword__clue">' + word.clue + '</li>');
    clue.attr('data-number', number);
    clue.attr('data-direction', word.direction);
    clue.attr('data-word-id', word.number);
    clue.val(number);
    clue.on('click', createWordSelectionHandler(word.number, number, word.direction));
    return clue;
  }

  function addInputTo(cell, word, number) {
    if (cell.find('input').length === 0) {
      cell.append('<input class="crossword__cell__input" type="text" maxlength="1" />');
    }
    var input = cell.find('input');
    input.off('click').on('click', createWordSelectionHandler(word.number, number, word.direction));
    input.on('blur', clearHighlighting);
    input.attr('data-' + word.direction, number);
  }

  // build game grid;
  this.render = function () {
    var board = getGameBoard();
    for (var y = 0; y < grid.length; y++) {
      var row = $('<div class="crossword__row"></div>')
      for (var x = 0; x < grid[y].length; x++) {
        var cell = $('<div class="crossword__cell"></div>');
        cell.appendTo(row);
      }
      row.appendTo(board);
    }

    var down = [];
    var across = [];

    // apply labels;
    for (var i = 0; i < words.length; i++) {
      var word = words[i];
      var startOfWord = findCellAtPosition(word.column, word.row);
      var number;
      if (word.direction === directions.DOWN) {
        down.push(word);
        number = down.length;
      } else if (word.direction === directions.ACROSS) {
        across.push(word);
        number = across.length;
      }
      for (var j = 0; j < word.answer.length; j++) {
        var cell;
        if (word.direction === directions.DOWN) {
          cell = findCellAtPosition(word.column, word.row + j);
          addInputTo(cell, word, number);
        } else if (word.direction = directions.ACROSS) {
          cell = findCellAtPosition(word.column + j, word.row);
          addInputTo(cell, word, number);
        }
      }
      var label = $('<span class="crossword__cell__label"></span>');
      label.text(number);
      label.appendTo(startOfWord);
    }

    var cluesDown = $('#crossword-clues-down');
    for (var j = 0; j < down.length; j++) {
      cluesDown.append(createClue(j + 1, down[j]));
    }

    var cluesAcross = $('#crossword-clues-across');
    for (var j = 0; j < across.length; j++) {
      cluesAcross.append(createClue(j + 1, across[j]));
    }

  }
}

(function () {
  var wg = new WordGrid(options);
  var game = new CrosswordGame(wg);
  game.render();
})();
