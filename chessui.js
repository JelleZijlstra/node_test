var chessui = (function($) {
	"use strict";
	function makeChessBoard() {
		var $board = $("<table>").addClass('chess-board');
		for(var row = 7; row >= 0; row--) {
			var $row = $("<tr>").addClass('chess-row');
			for(var column = 0; column < 8; column++) {
				var $cell = $("<td>").addClass('chess-field');
				var index = row * 8 + column;
				$cell.attr('data-chess-index', index);
				$row.append($cell);
			}
			$board.append($row);
		}
		$board.find('.chess-field').each(function() {
			var position = pos(parseInt($(this).attr('data-chess-index'), 10));
			// in black fields, sum of row and column is even
			var isEven = !!((position.column() + position.row()) % 2);
			$(this).addClass(isEven ? 'chess-even' : 'chess-odd');
		});
		return $board;
	}

	$.fn.chess = function() {

	};

	return {
		makeChessBoard: makeChessBoard
	};
})(jQuery);
