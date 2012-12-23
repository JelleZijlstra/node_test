var chessui = (function($) {
	"use strict";
	function BoardView($place) {
		var $ui = $("<div>").addClass('chess-ui');

		var $board = $("<table>").addClass('chess-board');

		var $data = $("<div>").addClass('chess-data-list');

		var $toPlayLine = $("<p>").append($("<span>").addClass('chess-label').text('To play'));
		var $toPlay = $("<span>").addClass('chess-toplay');
		$toPlayLine.append($toPlay);

		var $statusLine = $("<p>").append($("<span>").addClass('chess-label').text('Status'));
		var $status = $("<span>").addClass('chess-status');
		$statusLine.append($status);

		$data.append($toPlayLine).append($statusLine);
		$ui.append($board);
		$ui.append($data);

		var board = new jchess.ChessBoard();

		var activeField;

		var currentStatus = jchess.STILL_PLAYING;

		var view = this;

		this.getDOMBoard = function() {
			return $board;
		};
		this.getBackendBoard = function() {
			return board;
		};
		this.setStatus = function(newStatus) {
			currentStatus = newStatus;
			var text;
			switch(newStatus) {
				case jchess.STILL_PLAYING: text = "playing"; break;
				case jchess.WHITE_WON: text = "1–0"; break;
				case jchess.BLACK_WON: text = "0–1"; break;
				case jchess.DRAW: text = "1/2–1/2"; break;
			}
			$status.text(text);
		};
		this.setToPlay = function(toPlay) {
			$toPlay.text(toPlay);
		};

		this.setStatus(jchess.STILL_PLAYING);
		this.setToPlay("White");

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
			var isEven = ((position.column() + position.row()) % 2) !== 0;
			$(this).addClass(isEven ? 'chess-even' : 'chess-odd');
		});

		$board.find('.chess-field').click(function() {
			if(currentStatus === jchess.STILL_PLAYING) {
				var position = getPosition($(this));
				view.clearHighlighting();
				if(activeField !== undefined) {
					view.makeMove(activeField, position);
					activeField = undefined;
				} else if(board.positionIsFriendly(position)) {
					activeField = position;
					$(this).addClass('chess-highlighted-red');
					board.getMovesForPiece(position).forEach(function(move) {
						view.findCell(move.to()).addClass('chess-highlighted-yellow');
					});
				}
			}
		});

		this.applyBoard();

		$place.append($ui);
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
			var field = board.getField(position);
			var $div = $(this).find("div");
			$div.removeClass();
			if(!jchess.playerIsEmpty(field.color())) {
				var color = jchess.playerToString(field.color()).toLowerCase();
				var piece = jchess.pieceToFullName(field.piece()).toLowerCase();
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
	};

	BoardView.prototype.makeMove = function(from, to) {
		var move = new jchess.ChessMove(from, to);
		var response = this.getBackendBoard().applyMove(move);
		this.setStatus(response[0]);
		this.setToPlay(jchess.playerToString(response[1]));
		this.applyBoard();		
	};

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
