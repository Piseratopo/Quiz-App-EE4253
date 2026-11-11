import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../configs/apiClient';
import MultipleChoiceQuestion from './questions/MultipleChoiceQuestion';

function SearchBar({ search, setPage, setSearch }) {
   return (
      <div className="mt-2 flex items-center border border-black/20 rounded-md">
         <input
            type="text"
            placeholder="Tìm kiếm câu hỏi..."
            className="w-full p-2 bg-transparent outline-none"
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

   const fieldsetStyle =
      'pb-2 px-2 mb-2 rounded-md border border-1 border-primary';
   const updateButtonStyle = 'common-btn-nav mb-4';

   return (
      <div>
         <h2 className="page-title">Profile</h2>
         <form>
            <h3 className="text-xl font-bold my-4">Profile Description</h3>
            <fieldset className={fieldsetStyle}>
               <legend className="px-1">Username</legend>
               <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-transparent outline-none"
               />
            </fieldset>
            <button
               type="submit"
               className={`${updateButtonStyle} ${username === user ? 'opacity-50' : ''}`}
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
            <div className="grid grid-cols-3 gap-4">
               <fieldset className={`${fieldsetStyle} col-span-1}`}>
                  <legend className="px-1">Old Password</legend>
                  <input
                     type="password"
                     className="w-full bg-transparent outline-none"
                     onChange={(e) => setOldPassword(e.target.value)}
                  />
               </fieldset>
               <fieldset className={`${fieldsetStyle} col-span-1`}>
                  <legend className="px-1">New Password</legend>
                  <input
                     type="password"
                     className="w-full bg-transparent outline-none"
                     onChange={(e) => setNewPassword(e.target.value)}
                  />
               </fieldset>
               <fieldset className={`${fieldsetStyle} col-span-1`}>
                  <legend className="px-1">Repeat Password</legend>
                  <input
                     type="password"
                     className="w-full bg-transparent outline-none"
                     onChange={(e) => setRepeatPassword(e.target.value)}
                  />
               </fieldset>
            </div>
            <button
               type="submit"
               className={`${updateButtonStyle} ${newPassword !== repeatPassword || newPassword.length < 8 ? 'opacity-50' : ''}`}
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
            <p className="text-wrong">{error}</p>
         </form>
         <div>
            <h3 className="text-xl font-bold my-4">Your Questions</h3>
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
