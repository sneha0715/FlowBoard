import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { boardApi, cardApi, columnApi } from "../../api/services";

const sortByPosition = (items) =>
  [...items].sort((left, right) => (left.position ?? 0) - (right.position ?? 0));

const mapBoardState = (board, lists, cards, userRole) => {
  const orderedLists = sortByPosition(lists);
  const cardsById = {};
  const cardsByListId = {};

  orderedLists.forEach((list) => {
    cardsByListId[list.listId] = [];
  });

  sortByPosition(cards).forEach((card) => {
    cardsById[card.cardId] = card;
    if (!cardsByListId[card.listId]) {
      cardsByListId[card.listId] = [];
    }
    cardsByListId[card.listId].push(card.cardId);
  });

  return {
    activeBoard: board,
    lists: orderedLists,
    cardsById,
    cardsByListId,
    userRole: userRole || "NONE"
  };
};

const syncCardPositions = (cardIds, cardsById) =>
  cardIds.forEach((cardId, index) => {
    cardsById[cardId].position = index;
  });

export const fetchBoardBundle = createAsyncThunk("board/fetchBoardBundle", async (boardId, { getState }) => {
  const userId = getState().auth.user?.userId;
  const [board, lists, cards, userRole] = await Promise.all([
    boardApi.get(boardId),
    columnApi.byBoard(boardId),
    cardApi.byBoard(boardId),
    userId ? boardApi.getRole(boardId, userId) : Promise.resolve("NONE")
  ]);

  return mapBoardState(board, lists, cards, userRole);
});

export const createList = createAsyncThunk("board/createList", async ({ boardId, name, color }, { dispatch }) => {
  await columnApi.create({ boardId, name, color, position: 0 });
  await dispatch(fetchBoardBundle(boardId));
});

export const createCard = createAsyncThunk(
  "board/createCard",
  async (payload, { dispatch, rejectWithValue }) => {
    const {
      boardId,
      listId,
      title,
      description,
      priority,
      status,
      coverColor,
      dueDate,
      startDate,
      assigneeId
    } = payload;

    const bId = Number(boardId);
    const lId = Number(listId);

    if (!bId || !lId || isNaN(bId) || isNaN(lId)) {
      return rejectWithValue("Board ID and List ID are required and must be valid numbers.");
    }

    try {
      await cardApi.create({
        boardId: bId,
        listId: lId,
        title,
        description,
        priority,
        status,
        coverColor,
        dueDate: dueDate || null,
        startDate: startDate || null,
        assigneeId: assigneeId || null
      });
      await dispatch(fetchBoardBundle(bId));
    } catch (error) {
      return rejectWithValue(error.message || "Failed to create card.");
    }
  }
);

export const persistCardMove = createAsyncThunk(
  "board/persistCardMove",
  async ({ boardId, cardId, destinationListId, destinationIndex, sourceListId }, { getState }) => {
    await cardApi.move(cardId, destinationListId, destinationIndex);

    const state = getState().board;
    const destinationOrder = state.cardsByListId[destinationListId] || [];
    await cardApi.reorder(destinationListId, destinationOrder);

    if (sourceListId !== destinationListId) {
      const sourceOrder = state.cardsByListId[sourceListId] || [];
      await cardApi.reorder(sourceListId, sourceOrder);
    }

    return boardId;
  }
);

export const persistListMove = createAsyncThunk("board/persistListMove", async ({ boardId }, { getState }) => {
  const listIds = getState().board.lists.map((list) => list.listId);
  await columnApi.reorder(boardId, listIds);
  return boardId;
});

const boardSlice = createSlice({
  name: "board",
  initialState: {
    activeBoard: null,
    lists: [],
    cardsById: {},
    cardsByListId: {},
    userRole: "NONE",
    status: "idle",
    error: null
  },
  reducers: {
    moveCardOptimistic(state, action) {
      const { source, destination } = action.payload;
      const sourceListId = Number(source.droppableId.replace("list-", ""));
      const destinationListId = Number(destination.droppableId.replace("list-", ""));
      const sourceCards = [...(state.cardsByListId[sourceListId] || [])];
      const destinationCards =
        sourceListId === destinationListId
          ? sourceCards
          : [...(state.cardsByListId[destinationListId] || [])];

      const [movedCardId] = sourceCards.splice(source.index, 1);
      destinationCards.splice(destination.index, 0, movedCardId);

      state.cardsByListId[sourceListId] = sourceCards;
      state.cardsByListId[destinationListId] = destinationCards;
      state.cardsById[movedCardId].listId = destinationListId;

      syncCardPositions(sourceCards, state.cardsById);
      syncCardPositions(destinationCards, state.cardsById);
    },
    moveListOptimistic(state, action) {
      const { sourceIndex, destinationIndex } = action.payload;
      const reordered = [...state.lists];
      const [movedList] = reordered.splice(sourceIndex, 1);
      reordered.splice(destinationIndex, 0, movedList);
      reordered.forEach((list, index) => {
        list.position = index;
      });
      state.lists = reordered;
    },
    clearBoard(state) {
      state.activeBoard = null;
      state.lists = [];
      state.cardsById = {};
      state.cardsByListId = {};
      state.status = "idle";
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBoardBundle.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchBoardBundle.fulfilled, (state, action) => {
        state.status = "ready";
        state.error = null;
        state.activeBoard = action.payload.activeBoard;
        state.lists = action.payload.lists;
        state.cardsById = action.payload.cardsById;
        state.cardsByListId = action.payload.cardsByListId;
        state.userRole = action.payload.userRole;
      })
      .addCase(fetchBoardBundle.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Unable to load board.";
      })
      .addCase(createList.pending, (state) => {
        state.status = "saving";
      })
      .addCase(createList.fulfilled, (state) => {
        state.status = "ready";
      })
      .addCase(createCard.pending, (state) => {
        state.status = "saving";
      })
      .addCase(createCard.fulfilled, (state) => {
        state.status = "ready";
      })
      .addCase(persistCardMove.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Unable to save card movement.";
      })
      .addCase(persistListMove.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Unable to save list order.";
      });
  }
});

export const { moveCardOptimistic, moveListOptimistic, clearBoard } = boardSlice.actions;
export default boardSlice.reducer;
