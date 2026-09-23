import API from './axios.js';

// Auth
export const loginUser = (data) => API.post('/auth/login', data);
export const registerUser = (data) => API.post('/auth/register', data);

// Groups
export const getGroups = () => API.get('/groups');
export const createGroup = (data) => API.post('/groups', data);
export const getGroupDashboard = (groupId) => API.get(`/groups/${groupId}/dashboard`);

// Members & Search
export const addMember = (data) => API.post('/members', data);
export const getGroupMembers = (groupId, search = '') => 
  API.get(`/groups/${groupId}/members${search ? `?search=${search}` : ''}`);
export const getMemberProfile = (memberId) => API.get(`/members/${memberId}/profile`);

// Transactions (Savings, Loans, Repayments)
export const recordSavings = (data) => API.post('/savings', data);
export const getMemberSavings = (memberId) => API.get(`/members/${memberId}/savings`);
export const issueLoan = (data) => API.post('/loans', data);
export const getMemberLoans = (memberId) => API.get(`/members/${memberId}/loans`);
export const recordRepayment = (data) => API.post('/repayments', data);