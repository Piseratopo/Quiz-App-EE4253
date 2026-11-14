import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../configs/apiClient';
import MultipleChoiceQuestion from './questions/MultipleChoiceQuestion';

function SearchBar({ search, setPage, setSearch }) {
   return (
      <div className="profile-search">
         <input
            type="text"
            placeholder="Tìm kiếm câu hỏi..."
            className="profile-input"
            value={search}
            onChange={(e) => {
               setSearch(e.target.value);
               setPage(1);
            }}
         />
      </div>
   );
}

async function handleGetUserQuestions(id, page, search, setUserQuestions) {
   const token = localStorage.getItem('token');
   const response = await apiClient.get(
      `/questions?user=${id}&search=${search}&page=${page}`,
      {
         headers: { Authorization: `Bearer ${token}` },
      }
   );
   setUserQuestions(response.data);
}

async function handleUpdateUsername(
   id,
   username,
   setConfirmation,
   setError,
   updateUser
) {
   const token = localStorage.getItem('token');
   const response = await apiClient.patch(
      '/update-username',
      { username },
      {
         headers: { Authorization: `Bearer ${token}` },
      }
   );
   if (response.status === 200) {
      updateUser(id, username);
      setConfirmation('Username updated successfully.');
   } else {
      setError(response.data.error || 'Failed to update username');
      console.log(response.data);
   }
}

async function handleUpdatePassword(
   oldPassword,
   newPassword,
   setConfirmation,
   setError,
   setOldPassword,
   setNewPassword,
   setRepeatPassword
) {
   const token = localStorage.getItem('token');
   const response = await apiClient.patch(
      '/update-password',
      { oldPassword, newPassword },
      {
         headers: { Authorization: `Bearer ${token}` },
      }
   );
   if (response.status === 200) {
      setConfirmation('Password updated successfully.');
      setOldPassword('');
      setNewPassword('');
      setRepeatPassword('');
   } else {
      setError(response.data.error || 'Failed to update password');
   }
}

function Profile() {
   // User data
   const { id, user, updateUser } = useAuth();
   const [username, setUsername] = useState('');
   const [oldPassword, setOldPassword] = useState('');
   const [newPassword, setNewPassword] = useState('');
   const [repeatPassword, setRepeatPassword] = useState('');
   const [confirmation, setConfirmation] = useState('');
   const [error, setError] = useState('');
   // User's questions
   const [page, setPage] = useState(1);
   const [totalPage, setTotalPage] = useState(1);
   const [search, setSearch] = useState('');
   const [userQuestions, setUserQuestions] = useState({});

   useEffect(() => {
      setUsername(user);
      handleGetUserQuestions(id, page, search, setUserQuestions);
   }, [user, page, search]);

   const updateButtonStyle = 'btn-common-nav profile-submit';

   return (
      <div>
         <h2 className="page-title">Profile</h2>
         <form>
            <h3 className="profile-section-title">Profile Description</h3>
            <fieldset className="profile-fieldset">
               <legend>Username</legend>
               <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="profile-input"
               />
            </fieldset>
            <button
               type="submit"
               className={updateButtonStyle}
               disabled={username === user}
               onClick={(e) => {
                  e.preventDefault();
                  setConfirmation('');
                  setError('');
                  handleUpdateUsername(
                     id,
                     username,
                     setConfirmation,
                     setError,
                     updateUser
                  );
               }}
            >
               Update username
            </button>
            <div className="profile-password-grid">
               <fieldset className="profile-fieldset">
                  <legend>Old Password</legend>
                  <input
                     type="password"
                     className="profile-input"
                     onChange={(e) => setOldPassword(e.target.value)}
                  />
               </fieldset>
               <fieldset className="profile-fieldset">
                  <legend>New Password</legend>
                  <input
                     type="password"
                     className="profile-input"
                     onChange={(e) => setNewPassword(e.target.value)}
                  />
               </fieldset>
               <fieldset className="profile-fieldset">
                  <legend>Repeat Password</legend>
                  <input
                     type="password"
                     className="profile-input"
                     onChange={(e) => setRepeatPassword(e.target.value)}
                  />
               </fieldset>
            </div>
            <button
               type="submit"
               className={updateButtonStyle}
               disabled={
                  newPassword !== repeatPassword || newPassword.length < 8
               }
               onClick={(e) => {
                  e.preventDefault();
                  setConfirmation('');
                  setError('');
                  if (newPassword !== repeatPassword)
                     setError('Passwords do not match.');
                  if (newPassword.length < 8)
                     setError('Password must be at least 8 characters.');
                  handleUpdatePassword(
                     oldPassword,
                     newPassword,
                     setConfirmation,
                     setError,
                     setOldPassword,
                     setNewPassword,
                     setRepeatPassword
                  );
               }}
            >
               Update password
            </button>
            <p>{confirmation}</p>
            <p className="profile-error">{error}</p>
         </form>
         <div>
            <h3 className="profile-section-title">Your Questions</h3>
            <SearchBar
               search={search}
               setPage={setPage}
               setQuestions={setUserQuestions}
               setSearch={setSearch}
               setTotalPage={setTotalPage}
            />
            {Object.entries(userQuestions)
               .sort(([idA], [idB]) => parseInt(idB, 10) - parseInt(idA, 10))
               .map(
                  ([id, question]) =>
                     question.question_type === 'MCQ' && (
                        <MultipleChoiceQuestion
                           key={id}
                           id={id}
                           deletable={true} 
                           question={question.question}
                           possibleAnswers={question.possible_answers}
                           correctAnswers={question.correct_answers}
                           shuffle={question.shuffle}
                        />
                     )
               )}
         </div>
      </div>
   );
}

export default Profile;
