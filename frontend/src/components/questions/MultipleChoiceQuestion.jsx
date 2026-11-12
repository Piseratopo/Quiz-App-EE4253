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
      <form className="mcq-form">
         <div className="mcq-card">
            <div className="mcq-card-header">
               <div className="mcq-card-type">
                  Question Type: Multiple Choice
               </div>
               {deletable && (
                  <div className="mcq-delete-wrap">
                     <button
                     className="mcq-delete-button"
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
            <div className="mcq-question">
               <p className="mcq-question-text">{question}</p>
            </div>
            {playable && (
               <button
                  className={`mcq-submit ${
                     isSubmitted ? 'is-submitted' : userChoice ? 'has-selection' : 'is-unavailable'
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
            className="mcq-choices"
            style={{
               gridTemplateColumns: `repeat(${choiceArray.length}, 1fr)`,
            }}
         >
            {choiceArray.map((choice) => (
               <label
                  className={`mcq-choice ${
                     isSubmitted
                        ? correctAnswersArray.includes(choice)
                           ? 'is-correct'
                           : userChoice === choice
                             ? 'is-incorrect'
                             : ''
                        : userChoice === choice
                          ? 'is-selected'
                          : ''
                  } ${userChoice === choice ? 'is-active' : ''}`}
                  key={choice}
               >
                  <input
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
