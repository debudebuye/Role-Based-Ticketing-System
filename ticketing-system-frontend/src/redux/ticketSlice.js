import { createSlice } from '@reduxjs/toolkit';

const ticketSlice = createSlice({
  name: 'tickets',
  initialState: { tickets: [] },
  reducers: {
    setTickets: (state, action) => {
      state.tickets = action.payload;
    }
  }
});

export const { setTickets } = ticketSlice.actions;
export default ticketSlice.reducer;