/*
 * Functionality to represent a chess board.
 */
//var jchess = (function($) {
	function AssertionFailure(message) {
		this.message = message;
	}

	function assert(expr, desc) {
		if(!expr) {
			throw new AssertionFailure(desc);
		}
	}

	function assertThrows(f, desc) {
		try {
			f();
			assert(false, "expected exception to be thrown: " + desc);
		} catch(e) {
		}
	}

	function hasAny(arr, f) {
		for(var i = 0, len = arr.length; i < len; i++) {
			if(f(arr[i])) {
				return true;
			}
		}
		return false;
	}
	function silentAdd(array, f) {
		try {
			array.push(f());
		} catch(e) {
			// ignore
		}
	}

	function chainMethods(object, methods) {
		return function() {
			var out = object;
			methods.forEach(function(method) {
				out = out[method]();
			});
			return out;
		}
	}

	/*
	 * Functionality for accessing a position on the board.
	 */
	var pos = (function() {
		var cache = {};
		return function(input) {
			if(input instanceof Position) {
				return input;
			}
			if(typeof cache[input] === 'undefined') {
				cache[input] = new Position(input);
			}
			return cache[input];
		};
	})();
	function Position(input) {
		// input handling
		var position;
		if(typeof input === 'string') {
			position = Position.stringToInt(input);
		} else {
			position = input;
		}

		// methods
		this.algebraicColumn = function() {
			return String.fromCharCode(this.column() + 'a'.charCodeAt(0));
		};

		this.toString = function() {
			return this.algebraicColumn() + (this.row() + 1);
		};
		this.row = function() {
			return Math.floor(position / 8);
		};
		this.column = function() {
			return Math.floor(position % 8);
		};
		this.up = function() {
			assert(this.row() < 7, "cannot go further up");
			return pos(position + 8);
		};
		this.down = function() {
			assert(this.row() > 0, "cannot go further down");
			return pos(position - 8);
		};
		this.right = function() {
			assert(this.column() < 7, "cannot go further right");
			return pos(position + 1);
		};
		this.left = function() {
			assert(this.column() > 0, "cannot go further left");
			return pos(position - 1);
		};
		this.isValidPosition = function() {
			return position >= 0 && position < 64;
		};
		this.toInt = function() {
			return position;
		};
		assert(this.isValidPosition(), "Invalid position created");
	}
	Position.stringToInt = function(pos) {
		var column = pos.charCodeAt(0) - 'a'.charCodeAt(0);
		assert(column >= 0 && column < 8, "column out of range");
		var row = parseInt(pos[1], 10) - 1;
		assert(row >= 0 && row < 8, "row out of range");
		return row * 8 + column;
	};
	Position.prototype.equals = function(other) {
		var myInt = this.toInt();
		return (myInt === other) || (myInt === pos(other).toInt());
	};
	Position.prototype.downleft = function() {
		return this.down().left();
	};
	Position.prototype.downright = function() {
		return this.down().right();
	};
	Position.prototype.upleft = function() {
		return this.up().left();
	};
	Position.prototype.upright = function() {
		return this.up().right();
	};
	Position.prototype.knightMoves = function() {
		var out = [];
		var pos = this;
		var moves = [
			['left', 'downleft'], // WSW
			['down', 'downleft'], // SSW
			['down', 'downright'], // SSE
			['right', 'downright'], // ESE
			['right', 'upright'], // ENE
			['up', 'upright'], // NNE
			['up', 'upleft'], // NNW
			['left', 'upleft'] // WNW
		];
		moves.forEach(function(move) {
			silentAdd(out, chainMethods(pos, move));
		});
		return out;
	};
	Position.prototype.kingMoves = function() {
		var out = [];
		var pos = this;
		['left', 'right', 'up', 'down', 'upleft', 'upright', 'downleft', 'downright'].forEach(function(method) {
			silentAdd(out, function() {
				return pos[method]();
			});
		});
		return out;
	};
	Position.prototype.isBetween = function(bound1, bound2) {
		var direction = this.directionTo(bound1);
		if(direction === null) {
			return false;
		}
		return direction === bound2.directionTo(this);
	};
	Position.prototype.directionTo = function(to) {
	    // return null for not on same line, 1 for downleft, 2 for down, 3 for downright, 4 for right, 5 for upright, 6 for up, 7 for upleft, 8 for left
		var myColumn = this.column();
		var myRow = this.row();
		var theirColumn = to.column();
		var theirRow = to.row();
		if(myColumn === theirColumn) {
			return (myRow < theirRow) ? 6 : 2;
		}
		if(myRow === theirRow) {
			return (myColumn < theirColumn) ? 4 : 8;
		}
		var output = null;
		var pos = this;
		[
			[0, 7, 'upleft', 7],
			[7, 7, 'upright', 5],
			[0, 0, 'downleft', 1],
			[7, 0, 'downright', 3]
		].forEach(function(args) {
			for(var currPosition = pos; currPosition.column() != args[0] && currPosition.row() != args[1]; currPosition = currPosition[args[2]]()) {
				if(currPosition[args[2]]().equals(to)) {
					output = args[3];
					return;
				}
			}
		});
		return output;
	};

	/*
	 * Enumerated values.
	 */
	var NO_PLAYER = 0;
	var WHITE = 1;
	var BLACK = 2;
	function isValidPlayer(player) {
		return player >= NO_PLAYER && player <= BLACK;
	}

	var NO_PIECE = 0;
	var KING = 1;
	var QUEEN = 2;
	var ROOK = 3;
	var BISHOP = 4;
	var KNIGHT = 5;
	var PAWN = 6;
	function isValidPiece(piece) {
		return piece >= NO_PIECE && piece <= PAWN;
	}

	function pieceToString(piece) {
		assert(isValidPiece(piece), "Invalid piece");
		switch(piece) {
			case KING: return "K";
			case QUEEN: return "Q";
			case ROOK: return "R";
			case BISHOP: return "B";
			case KNIGHT: return "N";
			case PAWN: return "";
		}
	}
	function getMaterialWorth(piece) {
		assert(isValidPiece(piece), "Invalid piece");
		switch(piece) {
			case NO_PIECE: return 0;
			case KING: return 0;
			case QUEEN: return 9;
			case ROOK: return 5;
			case BISHOP: return 3;
			case KNIGHT: return 3;
			case PAWN: return 1;
		}
		assert(false, "Impossible");
	}

	/*
	 * Game status
	 */
	var STILL_PLAYING = 0;
	var WHITE_WON = 1;
	var BLACK_WON = 2;
	var DRAW = 3;
	var ILLEGAL_MOVE = 4;
	function isValidStatus(status) {
		return status >= STILL_PLAYING && status <= ILLEGAL_MOVE;
	}

	/*
	 * ChessPieceWithColor class.
	 */
	function ChessPieceWithColor(piece, color) {
		assert(isValidPiece(piece), "Invalid piece");
		assert(isValidPlayer(color), "Invalid color");
		this.piece = function() {
			return piece;
		};
		this.color = function() {
			return color;
		};
	}
	ChessPieceWithColor.empty = (function() {
		var empty = new ChessPieceWithColor(NO_PIECE, NO_PLAYER);
		return function() {
			return empty;
		};
	})();

	/*
	 * BoardChange class.
	 */
	function BoardChange(position, piece, color) {
		assert(isValidPosition(position), "Invalid position");
		assert(isValidPlayer(color), "Invalid color");
		assert(isValidPiece(piece), "Invalid piece");
		this.position = function() {
			return position;
		};
		this.color = function() {
			return color;
		};
		this.piece = function() {
			return piece;
		};
	}

	/*
	 * ChessMove class.
	 */
	var NORMAL_MOVE = 0;
	var CAPITULATION = 1;
	var DRAW_OFFER = 2;
	function isValidMoveType(type) {
		return type >= NORMAL_MOVE && type <= DRAW_OFFER;
	}

	function ChessMove() {
		var type;
		var from;
		var to;
		var promotedPiece;

		if(typeof arguments[1] === 'undefined') {
			type = arguments[0];
		} else {
			type = NORMAL_MOVE;
			from = arguments[0];
			assert(from.isValidPosition(), "Invalid position");
			to = arguments[1];
			assert(to.isValidPosition(), "Invalid position");
			promotedPiece = arguments[2] || NO_PIECE;
			assert(isValidPiece(promotedPiece), "Invalid promoted piece");
		}
		assert(isValidMoveType(type), "Invalid move type");

		this.type = function() {
			return type;
		};
		this.from = function() {
			return from;
		};
		this.to = function() {
			return to;
		};
		this.promotedPiece = function() {
			return promotedPiece;
		};
	}
	ChessMove.prototype.resetsFiftyMoveRule = function(board) {
		var fromPiece = board.getField(this.from());
		var toPiece = board.getField(this.to());
		return (fromPiece.piece() === PAWN || toPiece.piece() !== NO_PIECE || this.isRochade(board));
	};
	ChessMove.prototype.isRochade = function(board) {
		var from = this.from();
		var fromPiece = board.getField(from);
		if(fromPiece.piece() === KING) {
			var to = this.to();
			return from.column() == 4 && (to.column() == 2 || to.column() == 6);
		}
	};
	ChessMove.prototype.getAlgebraicRepresentation = function(board) {
		var from = this.from();
		var to = this.to();
		var movingPiece = board.getField(from);
		var pieceAtFieldToMoveTo = board.getField(to);
		var isCapturing = pieceAtFieldToMoveTo.piece() !== NO_PIECE;

	    if(movingPiece.piece() == KING && from.column() == 5 && (to.column() == 3 || to.column() == 7)) {
	        if(to.column() == 7) {
		        // king's rochade
	            return "0-0";
	        } else {
	        	// queen's rochade
	        	return "0-0-0";
	        }
	    } else {
	    	var output = "";
	        if(movingPiece.piece() == PAWN) {
	            if(isCapturing) {
	            	output += from.algebraicColumn();
	            }
	        } else {
	        	output += pieceToString(movingPiece.piece());
	        }
	        if(isCapturing) {
	        	output += "x";
	        }
	        output += to.toString();
	        if(move.promotedPiece()) {
	        	output += pieceToString(move.promotedPiece());
	        }
	        return output;
	    }
	};

	/*
	 * CheckStatus class.
	 */
	var DIRECT_CHECK = 0;
	var PIECE_PINNED = 1;
	function CheckStatus(type, position) {
		assert(type === DIRECT_CHECK || type === PIECE_PINNED, "Invalid CheckStatus type");
		assert(position.isValidPosition(), "Invalid position");
		this.type = function() {
			return type;
		};
		this.position = function() {
			return position;
		};
	}

	// build up starting board
	var startingBoard = (function() {
		var board = [];
		board.push(new ChessPieceWithColor(ROOK, WHITE));
		board.push(new ChessPieceWithColor(KNIGHT, WHITE));
		board.push(new ChessPieceWithColor(BISHOP, WHITE));
		board.push(new ChessPieceWithColor(QUEEN, WHITE));
		board.push(new ChessPieceWithColor(KING, WHITE));
		board.push(new ChessPieceWithColor(BISHOP, WHITE));
		board.push(new ChessPieceWithColor(KNIGHT, WHITE));
		board.push(new ChessPieceWithColor(ROOK, WHITE));
		var wp = new ChessPieceWithColor(PAWN, WHITE);
		for(var i = 0; i < 8; i++) {
			board.push(wp);
		}
		for(var i = 0; i < 4 * 8; i++) {
			board.push(ChessPieceWithColor.empty());
		}
		var bp = new ChessPieceWithColor(PAWN, BLACK);
		for(var i = 0; i < 8; i++) {
			board.push(bp);
		}
		board.push(new ChessPieceWithColor(ROOK, BLACK));
		board.push(new ChessPieceWithColor(KNIGHT, BLACK));
		board.push(new ChessPieceWithColor(BISHOP, BLACK));
		board.push(new ChessPieceWithColor(QUEEN, BLACK));
		board.push(new ChessPieceWithColor(KING, BLACK));
		board.push(new ChessPieceWithColor(BISHOP, BLACK));
		board.push(new ChessPieceWithColor(KNIGHT, BLACK));
		board.push(new ChessPieceWithColor(ROOK, BLACK));
		return board;
	})();

	/*
	 * ChessBoard class. Default constructor builds the starting position.
	 */
	function ChessBoard() {
		/*
		 * private member variables
		 */
		var board = [];
		var rochades = [];
		var playerToPlay = BLACK;
		var allowedAtNextMove = [];
		var checkStatus = [];
		var isInCheck = false;
		var fiftyMoveCounter = 0;
		var movesPlayed = [];

		/*
		 * Initialization
		 */
		this.setBoard(startingBoard);

		rochades[WHITE] = [];
		rochades[WHITE][KING] = true;
		rochades[WHITE][QUEEN] = true;
		rochades[BLACK] = [];
		rochades[BLACK][KING] = true;
		rochades[BLACK][QUEEN] = true;

		this.prepareNextMove();

		/*
		 * Public methods with access to private state.
		 */
		this.setField = function(pos, piece) {
			board[pos.toInt()] = piece;
		};
		this.getField = function(pos) {
			return board[pos.toInt()];
		};
		this.rochadeIsAllowed = function(player, piece) {
			assert(isValidPlayer(player), "Invalid player");
			assert(isValidPiece(piece), "Invalid piece");
			return rochades[player][piece];
		};
		this.disallowRochade = function(player, piece) {
			assert(isValidPlayer(player), "Invalid player");
			assert(isValidPiece(piece), "Invalid piece");
			rochades[player][piece] = false;
		};
		this.toPlay = function() {
			return playerToPlay;
		};
		this.changePlayer = function() {
			playerToPlay = this.enemyPlayer();
			return playerToPlay;
		};
		this.incrementFiftyMove = function() {
			fiftyMoveCounter++;
			return fiftyMoveCounter > 100;
		};
		this.resetFiftyMove = function() {
			fiftyMoveCounter = 0;
		};
		this.addMove = function(move) {
			movesPlayed.push(move);
		};
		this.lastMove = function() {
			return movesPlayed.slice(-1)[0];
		};
		this.allowedAtNextMove = function() {
			return allowedAtNextMove;
		};
		this.resetAllowedAtNextMove = function() {
			allowedAtNextMove = [];
		};
		this.addAllowedMove = function(from, to) {
			if(this.checkCheckStatus(from, to)) {
				var fromInt = from.toInt();
				allowedAtNextMove[fromInt] = allowedAtNextMove[fromInt] || [];
				allowedAtNextMove[fromInt][to.toInt()] = new ChessMove(from, to);
			}
		};
		this.hasAllowedMoves = function() {
			return allowedAtNextMove.length > 0;
		}
		this.moveIsLegal = function(from, to) {
			return typeof allowedAtNextMove[from.toInt()][to.toInt()] !== 'undefined';
		};
		this.getMovesForPiece = function(from) {
			return allowedAtNextMove[from].filter(function(elt) {
				return typeof elt !== 'undefined';
			});
		};
		this.setCheckStatus = function(status, inCheck) {
			checkStatus = status;
			isInCheck = check;
		};
		this.eachCheckStatus = function(f) {
			checkStatus.forEach(f);
		};
		this.isCheck = function() {
			return isInCheck;
		};

		// calling code may overwrite this method in order to add a UI for this
		this.choosePieceToPromoteTo = function() {
			return QUEEN;
		};
	}
	ChessBoard.prototype.setBoard = function(board) {
		assert(board.length === 64, "board must have 64 fields");
		for(var i = 0; i < 64; i++) {
			this.setField(pos(i), board[i]);
		}
	};
	ChessBoard.prototype.enemyPlayer = function() {
		if(this.toPlay() === WHITE) {
			return BLACK;
		} else {
			return WHITE;
		}
	};

	ChessBoard.prototype.positionIsEnemy = function(position) {
		var piece = this.getField(position);
		return piece.color() === this.enemyPlayer();
	};

	/*
	 * Basic API
	 */
	ChessBoard.prototype.applyMove = function(move) {
		var type = move.type();
		if(type === DRAW_OFFER) {
			return [DRAW, NO_PLAYER, "1/5–1/5"];
		} else if(type === CAPITULATION) {
			if(this.toPlay() === BLACK) {
				return [WHITE_WON, NO_PLAYER, "1–0"];
			} else {
				return [BLACK_WON, NO_PLAYER, "0–1"];
			}
		}
		if(!this.moveIsLegal(from, to)) {
			return [ILLEGAL_MOVE, this.toPlay(), null];
		}
		var algebraic = move.getAlgebraicRepresentation(this);

		if(move.resetsFiftyMoveRule(this)) {
			this.resetFiftyMove();
		} else if(this.incrementFiftyMove()) {
			return [DRAW, NO_PLAYER, "1/5–1/5"];
		}
		var changes = this.makeChangesArray(move);

		this.changeRochadeProperties(move);
		this.applyChanges(changes);
		this.addMove(move);

		var status = this.prepareNextMove();

		return [status, this.toPlay(), move.getAlgebraicRepresentation(), changes];
	};

	/*
	 * Applying a move.
	 */
	ChessBoard.prototype.makeChangesArray = function(move) {
		var changes = [];
		var from = move.from();
		var to = move.to();
		var myColor = this.playerToPlay();
		var enemyColor = this.enemyColor();
		var movingPiece = this.getField(from).piece();
		var pieceAtFieldToMoveTo = (move.promotedPiece() === NO_PIECE) ? movingPiece : move.promotedPiece();

		// en passant
		if(movingPiece === PAWN && (to.column() !== from.column()) && !this.positionIsEnemy(to)) {
			var field;
			if(myColor === WHITE) {
				field = (to === from.left().up()) ? from.left() : from.right();
			} else {
				field = (to === from.left().down()) ? from.left() : from.right();
			}
			changes.push(new BoardChange(field, NO_PIECE, NO_PLAYER));
		}

		// vacate field we come from
		changes.push(new BoardChange(from, NO_PIECE, NO_PLAYER));
		// ... and fill the one we're going to
		changes.push(new BoardChange(to, pieceAtFieldToMoveTo, myColor));

		// rochades
		if(move.isRochade(this)) {
			if(to.column() === 6) {
				// king's rochade
				if(myColor === WHITE) {
					changes.push(new BoardChange(pos("h1"), NO_PIECE, NO_PLAYER));
					changes.push(new BoardChange(pos("f1"), ROOK, WHITE));
				} else {
					changes.push(new BoardChange(pos("h8"), NO_PIECE, NO_PLAYER));
					changes.push(new BoardChange(pos("f8"), ROOK, BLACK));
				}
			} else {
				// queen's rochade
				if(myColor === WHITE) {
					changes.push(new BoardChange(pos("a1"), NO_PIECE, NO_PLAYER));
					changes.push(new BoardChange(pos("d1"), ROOK, WHITE));
				} else {
					changes.push(new BoardChange(pos("a8"), NO_PIECE, NO_PLAYER));
					changes.push(new BoardChange(pos("d8"), ROOK, BLACK));
				}
			}
		}
		return changes;
	};

	ChessBoard.prototype.applyChanges = function(changes) {
		var board = this;
		changes.forEach(function(change) {
			board.setField(change.position(), new ChessPieceWithColor(change.piece(), change.color()));
		});
	};

	ChessBoard.prototype.changeRochadeProperties = function(move) {
		var from = move.from();
		var to = move.to();
		var movingPiece = this.getField(from).piece();
		var toPlay = this.toPlay();
		if(movingPiece === KING) {
			this.disallowRochade(toPlay, KING);
			this.disallowRochade(toPlay, QUEEN);
		}
		if(to.equals("h8")) {
			this.disallowRochade(BLACK, KING);
		} else if(to.equals("a8")) {
			this.disallowRochade(BLACK, QUEEN);
		} else if(to.equals("a1")) {
			this.disallowRochade(WHITE, QUEEN);
		} else if(to.equals("h1")) {
			this.disallowRochade(WHITE, KING);
		}
		if(movingPiece === ROOK) {
			if(toPlay === WHITE) {
	            // the check on move.to is necessary because otherwise a user may be able to do a rochade after having the A rook captured and moving the H rook over to A1. Alternatively, we could check for capturing on A1, but this is simpler.
            	if(from.equals("a1") || to.equals("a1")) {
            		this.disallowRochade(WHITE, QUEEN);
            	} else if(from.equals("h1") || to.equals("h1")) {
            		this.disallowRochade(WHITE, KING);
            	}
			} else {
            	if(from.equals("a8") || to.equals("a8")) {
            		this.disallowRochade(BLACK, QUEEN);
            	} else if(from.equals("h8") || to.equals("h8")) {
            		this.disallowRochade(BLACK, KING);
            	}
			}
		}
	};

	ChessBoard.prototype.prepareNextMove = function() {
		this.changePlayer();
		this.determineIsCheck();
		return this.checkAllowedAtNextMove();
	};

	/*
	 * Assembling the list of legal moves.
	 */
	ChessBoard.prototype.determineIsCheck = function() {
		var status = [];
		var isInCheck = false;
		var myColor = this.toPlay();
		var enemyColor = this.enemyPlayer();
		var kingPosition = this.findKing(myColor);
		var board = this;

		// knight checks
		kingPosition.knightMoves().forEach(function(pos) {
			var piece = board.getField(pos);
			// if there is a knight in that position, it's a check
			if(piece.color() === enemyColor && piece.piece() === KNIGHT) {
				status.push(new CheckStatus(DIRECT_CHECK, pos));
				isInCheck = true;
			}
		});

		// horizontal, vertical, and diagonal checks from queens, rooks, and bishops
		// this function keeps executing the method until the end of the board or until it finds a check
		var findChecks = function(method, pieces) {
			var nextPosition;
			for(var position = kingPosition, friendPosition = null; ; position = nextPosition) {
				try {
					nextPosition = position[method]();
				} catch(e) {
					// we've reached the end of the board
					return;
				}
				var nextPiece = board.getField(nextPosition);
				// in order to keep track of pins, track presence of friendly pieces between king and enemy pieces
				if(nextPiece.color() === myColor) {
					if(friendPosition === null) {
						return;
					} else {
						friendPosition = nextPosition;
					}
				} else if(nextPiece.color() === enemyColor) {
					if(pieces.indexOf(nextPiece.piece()) !== -1) {
						var type = (friendPosition === null) ? DIRECT_CHECK : PIECE_PINNED;
						status.push(new CheckStatus(type, nextPosition));
						if(type === DIRECT_CHECK) {
							isInCheck = true;
						}
						return;
					}
				}

			}
		};
		// list of pieces dangerous in these directions
		var horiverti = [ROOK, QUEEN];
		var diagonal = [BISHOP, QUEEN];
		[
			['up', horiverti],
			['down', horiverti],
			['left', horiverti],
			['right', horiverti],
			['upleft', diagonal],
			['upright', diagonal],
			['downleft', diagonal],
			['downright', diagonal]
		].forEach(function(arr) {
			findChecks(arr[0], arr[1]);
		});

		// pawn checks
		var findPawnChecks = function(method) {
			var nextPosition;
			try {
				nextPosition = kingPosition[method]();
			} catch(e) {
				return;
			}
			var piece = board.getField(nextPosition);
			if(piece.color() === enemyColor && piece.piece() === PAWN) {
				status.push(new CheckStatus(DIRECT_CHECK, nextPosition));
				isInCheck = true;
			}
		};
		var pawnDirections = (myColor === WHITE) ? ['upleft', 'upright'] : ['downleft', 'downright'];
		pawnDirections.forEach(findPawnChecks);

		// apply the check status found
		this.setCheckStatus(status, isInCheck);
	};

	ChessBoard.prototype.checkAllowedAtNextMove = function() {
		var myColor = this.toPlay();
		this.resetAllowedAtNextMove();
		for(var i = 0; i < 64; i++) {
			var position = pos(i);
			var piece = this.getField(position);
			if(piece.color() === myColor) {
				this.allowedMovesByPiece(piece.piece(), position);
			}
		}
		if(this.hasAllowedMoves()) {
			return STILL_PLAYING;
		} else if(this.isCheck()) {
			// checkmate
			return myColor === WHITE ? BLACK_WON : WHITE_WON;
		} else {
			// stalemate
			return DRAW;
		}
	};

	ChessBoard.prototype.allowedMovesForPiece = function(piece, position) {
		var myColor = this.toPlay();
		var board = this;
		switch(piece) {
			case KING:
				var rochadePosition = (myColor === WHITE) ? pos("e1") : pos("e8");
				if(position.equals(rochadePosition) && !this.isCheck()) {
					// king's rochade
					if(this.rochadeIsAllowed(myColor, KING) && this.positionIsEmpty(rochadePosition.right()) && !this.positionIsInCheck(position.right()) && this.positionIsEmpty(position.right().right())) {
						this.addAllowedMoveIfNotInCheck(position, position.right().right());
					}
					// queen's rochade
					if(this.rochadeIsAllowed(myColor, QUEEN) && this.positionIsEmpty(rochadePosition.left()) && !this.positionIsInCheck(position.left()) && this.positionIsEmpty(position.left().left()) && this.positionIsEmpty(position.left().left().left())) {
						this.addAllowedMoveIfNotInCheck(position, position.left().left());
					}
				}
				position.kingMoves().forEach(function(newPosition) {
					this.addAllowedMoveIfNotInCheck(position, newPosition);
				});
				break;
			case QUEEN:
				this.addBishopMoves(position);
				this.addRookMoves(position);
				break;
			case BISHOP:
				this.addBishopMoves(position);
				break;
			case ROOK:
				this.addRookMoves(position);
				break;
			case KNIGHT:
				position.knightMoves.forEach(function(newPosition) {
					this.addAllowedMoveIfPossible(position, newPosition);
				});
				break;
			case PAWN:
				var doubleLeapRow = (myColor === WHITE) ? 1 : 6;
				var direction = (myColor === WHITE) ? 'up' : 'down';
				var enPassantRow = (myColor === WHITE) ? 4 : 3;
				// normal moves
				var oneUp = position[direction]();
				if(this.positionIsEmpty(oneUp)) {
					this.addAllowedMove(position, oneUp);
					if(position.row() === doubleLeapRow) {
						var twoUp = oneUp[direction]();
						if(this.positionIsEmpty(twoUp)) {
							this.addAllowedMove(position, twoUp);
						}
					}
				}
				// capture
				if(position.column() !== 0 && this.positionIsEnemy(position.left()[direction]())) {
					this.addAllowedMove(position, position.left()[direction]());
				}
				if(position.column() !== 7 && this.positionIsEnemy(position.right()[direction]())) {
					this.addAllowedMove(position, position.right()[direction]());
				}
				// en passant
				if(position.row() === enPassantRow) {
					var checker = function(side) {
						var neighborPosition;
						try {
							neighborPosition = position[side]();
						} catch(e) {
							// off the board
							return;
						}
						if(this.positionIsEnemy(neighborPosition) && this.getField(neighborPosition).piece() === PAWN) {
							var lastMove = this.lastMove();
							if(lastMove.to().equals(neighborPosition) && lastMove.from().equals(neighborPosition[direction]()[direction]())) {
								board.addAllowedMove(position, neighborPosition[direction]());
							}
						}
					}
					['left', 'right'].forEach(checker);
				}
				break;
		}
	};
	ChessBoard.prototype.movesInDirection = function(position, direction) {
		var myColor = this.toPlay();
		var enemyColor = this.enemyColor();
		var nextPosition;
		for(var currPosition = position; ; currPosition = nextPosition) {
			try {
				nextPosition = currPosition[direction]();
			} catch(e) {
				return;
			}
			var nextPiece = this.getField(nextPosition);
			if(nextPiece.color() === myColor) {
				return;
			}
			this.addAllowedMove(position, nextPosition);
			if(nextPiece.color() === enemyColor) {
				return;
			}
		}
	};
	ChessBoard.prototype.addBishopMoves = function(position) {
		var board = this;
		['upleft', 'upright', 'downleft', 'downright'].forEach(function(direction) {
			board.movesInDirection(position, direction);
		});
	};
	ChessBoard.prototype.addRookMoves = function(position) {
		var board = this;
		['up', 'down', 'left', 'right'].forEach(function(direction) {
			board.movesInDirection(position, direction);
		});
	};

	ChessBoard.prototype.addAllowedMoveIfPossible = function(from, to) {
		if(!this.positionIsFriendly(to)) {
			this.addAllowedMove(from, to);
		}
	};
	ChessBoard.prototype.addAllowedMoveIfNotInCheck = function(from, to) {
		if(!this.positionIsInCheck(to)) {
			this.addAllowedMove(from, to);
		}
	};
	ChessBoard.prototype.checkCheckStatus = function(from, to) {
		var myColor = this.toPlay();
		var kingPosition = this.findKing(myColor);
		var isOK = true;
	    // if the king is moving, always allow it; other checks will have caught any issues
		if(!kingPosition.equals(from)) {
			this.eachCheckStatus(function(status) {
				if(!isOK) {
					// no need to check further
					return;
				}
				var position = status.position();
				if(status.type() === PIECE_PINNED) {
					if(from.isBetween(kingPosition, position) && !to.isBetween(kingPosition, position) && !to.equals(position)) {
						isOK = false;
					}
				} else {
					if(!to.equals(position) && !to.isBetween(kingPosition, position)) {
						isOK = false;
					}
				}
			});
		}
		return isOK;
	};

	ChessBoard.prototype.positionIsEmpty = function(position) {
		return this.getField(position).piece() === NO_PIECE;
	};
	ChessBoard.prototype.positionIsEnemy = function(position) {
		return this.getField(position).color() === this.enemyColor();
	};
	ChessBoard.prototype.positionIsFriendly = function(position) {
		return this.getField(position).color() === this.toPlay();
	};

	ChessBoard.prototype.positionIsInCheck = function(position) {
		var board = this;
		var myColor = this.toPlay();
		var enemyColor = this.enemyColor();

		// check for king and knight
		var simple = [
			[KING, 'kingMoves'],
			[KNIGHT, 'knightMoves']
		];
		if(simple.some(function(data) {
			return position[data[1]]().some(function(position) {
				var piece = this.getField(position);
				return piece.color() === enemyColor && piece.piece() === data[0];
			});
		})) {
			return true;
		}

		// pawn checks
		var pawnDirections = (myColor === WHITE) ? ['upleft', 'upright'] : ['downleft', 'downright'];
		if(pawnDirections.some(function(method) {
			var nextPosition;
			try {
				nextPosition = kingPosition[method]();
			} catch(e) {
				return false;
			}
			var piece = board.getField(nextPosition);
			return piece.color() === enemyColor && piece.piece() === PAWN;
		})) {
			return true;
		}

		// check for queen, rook, bishop
		var findChecks = function(method, pieces) {
			var nextPosition;
			for(var position = kingPosition, friendPosition = null; ; position = nextPosition) {
				try {
					nextPosition = position[method]();
				} catch(e) {
					// we've reached the end of the board
					return false;
				}
				var nextPiece = board.getField(nextPosition);
				// in order to keep track of pins, track presence of friendly pieces between king and enemy pieces
				if(nextPiece.color() === myColor && nextPiece.piece() !== KING) {
					return false;
				} else if(nextPiece.color() === enemyColor) {
					return pieces.indexOf(nextPiece.piece()) !== -1;
				}
			}
		};
		var horiverti = [ROOK, QUEEN];
		var diagonal = [BISHOP, QUEEN];
		return [
			['up', horiverti],
			['down', horiverti],
			['left', horiverti],
			['right', horiverti],
			['upleft', diagonal],
			['upright', diagonal],
			['downleft', diagonal],
			['downright', diagonal]
		].some(function(arr) {
			return findChecks(arr[0], arr[1]);
		});
	};

	ChessBoard.prototype.findKing = function(color) {
		for(var i = 0; i < 64; i++) {
			var position = pos(i);
			var piece = this.getField(piece);
			if(piece.piece() === KING && piece.color() === color) {
				return position;
			}
		}
		assert(false, "No king found");
	};

	ChessBoard.prototype.getMaterialBalance = function() {
		var balance = 0;
		for(var i = 0; i < 64; i++) {
			var piece = this.getField(pos(i));
			var worth = getMaterialWorth(piece.piece());
			if(piece.color() === BLACK) {
				worth *= -1;
			}
			balance += worth;
		}
		// reverse if black to play
		if(this.toPlay() === BLACK) {
			return -balance;
		} else {
			return balance;
		}
	}

	/*
	 * Testing
	 */
	function runTests() {
		assert(positionToInt("a1") === 0, "cannot convert a1");
		assert(positionToInt("b1") === 1, "cannot convert b1");
		assert(positionToInt("a2") === 8, "cannot convert a2");
		assert(positionToInt("h8") === 63, "cannot convert h8");

		assert(intToPosition(0) === "a1", "cannot convert to a1");
		assert(intToPosition(1) === "b1", "cannot convert to b1");
		assert(intToPosition(8) === "a2", "cannot convert to a2");
		assert(intToPosition(63) === "h8", "cannot convert to h8");

		assert(row(0) === 0, "incorrect row");
		assert(row(8) === 1, "incorrect row");
		assert(row(63) === 7, "incorrect row");

		assert(column(0) === 0, "incorrect column");
		assert(column(1) === 1, "incorrect column");
		assert(column(63) === 7, "incorrect column");

		assert(up(0) === 8, "incorrect up");
		assertThrows(function() { up(63); }, "can't go up");
		assert(down(8) === 0, "incorrect down");
		assertThrows(function() { down(0); }, "can't go down");
		assert(left(1) === 0, "incorrect left");
		assertThrows(function() { left(0); }, "can't go left");
		assert(right(0) === 1, "incorrect right");
		assertThrows(function() { right(63); }, "can't go right");
	}
//})(jQuery);