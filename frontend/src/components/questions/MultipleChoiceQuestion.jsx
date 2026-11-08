import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrash } from 'react-icons/fa';
import apiClient from '../../configs/apiClient';

async function deleteQuestion(id, navigate) {
   const token = localStorage.getItem('token');
   try {
      const response = await apiClient.delete(`/questions/${id}`, {
         headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
         navigate('/profile');
      }
   } catch (error) {
      console.error('Error deleting question:', error);
   }
}

export default function MultipleChoiceQuestion({
   id,
   correctAnswers,
   deletable = false,
   playable = true,
   possibleAnswers,
   question,
   shuffle,
}) {
   const [choiceArray, setChoiceArray] = useState([]);
   const [correctAnswersArray, setCorrectAnswersArray] = useState([]);
   useEffect(() => {
      if (shuffle)
         setChoiceArray(
            JSON.parse(possibleAnswers).sort(() => Math.random() - 0.5)
         );
      else setChoiceArray(JSON.parse(possibleAnswers));
      setCorrectAnswersArray(JSON.parse(correctAnswers));
   }, []);

   const [isSubmitted, setIsSubmitted] = useState(!playable);
   const [userChoice, setUserChoice] = useState(null);

   const navigate = useNavigate();

   return (
      <form className="my-6">
         <div className="my-2 border-primary border-2 transition duration-400 ease-in-out">
            <div className="border-b border-primary flex items-center">
               <div className="text-sm px-1 w-full">
                  Question Type: Multiple Choice
               </div>
               {deletable && (
                  <div className="text-sm px-1 flex items-center">
                     <button
                        className="opacity-50 hover:opacity-100 transition duration-400 ease-in-out"
                        onClick={(e) => {
                           e.preventDefault();
                           deleteQuestion(id, navigate);
                        }}
                     >
                        <FaTrash />
                     </button>
                  </div>
               )}
            </div>
            <div className="text-2xl flex items-center justify-center py-12 px-4">
               <p className="text-center">{question}</p>
            </div>
            {playable && (
               <button
                  className={`w-full py-2 transition duration-400 ease-in-out ${
                     isSubmitted
                        ? 'bg-background text-primary '
                        : userChoice
                          ? 'bg-primary text-background'
                          : 'bg-gray-400 text-background disabled'
                  }`}
                  type="submit"
                  onClick={(e) => {
                     e.preventDefault();
                     if (userChoice) {
                        setIsSubmitted(true);
                     }
                  }}
                  disabled={isSubmitted || !userChoice}
               >
                  {isSubmitted ? 'Submitted' : 'Submit'}
               </button>
            )}
         </div>
         <div
            className="grid gap-2"
            style={{
               gridTemplateColumns: `repeat(${choiceArray.length}, 1fr)`,
            }}
         >
            {choiceArray.map((choice) => (
               <label
                  className={`flex items-center justify-center py-8 px-4 border border-primary text-center text-lg transition duration-400 ease-in-out ${
                     isSubmitted
                        ? correctAnswersArray.includes(choice)
                           ? 'bg-primary text-background'
                           : userChoice === choice
                             ? 'bg-wrong text-background border-wrong'
                             : ''
                        : userChoice === choice
                          ? 'bg-secondary'
                          : ''
                  } ${userChoice === choice ? 'font-bold' : ''}`}
                  key={choice}
               >
                  <input
                     className="appearance-none"
                     type="radio"
                     name={`${question}`}
                     value={choice}
                     onChange={(e) => setUserChoice(e.target.value)}
                     disabled={isSubmitted}
                  />
                  {choice}
               </label>
            ))}
         </div>
      </form>
   );
}
