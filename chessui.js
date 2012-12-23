var chessui = (function($) {
	"use strict";
	function BoardView($place) {
		var $board = $("<table>").addClass('chess-board');

		var board = new jchess.ChessBoard();

		var activeField = undefined;

		var view = this;

		this.getDOMBoard = function() {
			return $board;
		};
		this.getBackendBoard = function() {
			return board;
		};

		for(var row = 7; row >= 0; row--) {
			var $row = $("<tr>").addClass('chess-row');
			for(var column = 0; column < 8; column++) {
				var $cell = $("<td>").addClass('chess-field').append($("<div>"));
				var index = row * 8 + column;
				$cell.attr('data-chess-index', index);
				$row.append($cell);
			}
			$board.append($row);
		}

		this.iterateFields(function(position) {
			// in black fields, sum of row and column is even
			var isEven = !!((position.column() + position.row()) % 2);
			$(this).addClass(isEven ? 'chess-even' : 'chess-odd');
		});

		$board.find('.chess-field').click(function() {
			var position = getPosition($(this));
			view.clearHighlighting();
			if(activeField !== undefined) {
				var response = board.applyMove(new jchess.ChessMove(activeField, position));
				console.log(response);
				view.applyBoard();
				activeField = undefined;
			} else if(board.positionIsFriendly(position)) {
				activeField = position;
				$(this).addClass('chess-highlighted-red');
				board.getMovesForPiece(position).forEach(function(move) {
					view.findCell(move.to()).addClass('chess-highlighted-yellow');
				});
			}
		});

		this.applyBoard();

		$place.append($board);
	}

	BoardView.prototype.iterateFields = function(callback) {
		this.getDOMBoard().find('.chess-field').each(function() {
			var position = getPosition($(this));
			return callback.call(this, position);
		});
	};

	BoardView.prototype.applyBoard = function() {
		this.clearHighlighting();
		var board = this.getBackendBoard();
		this.iterateFields(function(position) {
			var piece = board.getField(position);
			var $div = $(this).find("div");
			$div.removeClass();
			if(!jchess.playerIsEmpty(piece.color())) {
				var color = jchess.playerToString(piece.color()).toLowerCase();
				var piece = jchess.pieceToFullName(piece.piece()).toLowerCase();
				var newClassName = 'chess-' + color + '-' + piece;
				$div.addClass(newClassName);
			}
		});
	};

	BoardView.prototype.clearHighlighting = function() {
		this.getDOMBoard().find('.chess-field').removeClass('chess-highlighted-yellow').removeClass('chess-highlighted-red');
	};

	BoardView.prototype.findCell = function(position) {
		return this.getDOMBoard().find('.chess-field[data-chess-index=' + position.toInt() + ']');
	}

	function getPosition($cell) {
		return jchess.pos(parseInt($cell.attr('data-chess-index'), 10));
	}

	$.fn.chess = function() {
		var view = new BoardView($(this));
		return view.getBackendBoard();
	};

	return {
		BoardView: BoardView
	};
})(jQuery);
