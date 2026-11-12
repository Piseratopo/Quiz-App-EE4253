function QuestionDisplay({ answerArray, correctAnswer, question }) {
   return (
      <section className="question-preview">
         <div className="question-preview-header">
            <p
               className={`question-preview-title ${question ? '' : 'is-empty'}`}
            >
               {question ? question : 'Type your question in the left panel.'}
            </p>
         </div>
         <div
            className="question-preview-answers"
            style={{
               gridTemplateColumns: `repeat(${answerArray.length}, 1fr)`,
            }}
         >
            {answerArray.map((answer, i) => (
               <div
                  key={i}
                  className="question-preview-answer"
                  style={{ wordBreak: 'break-word' }}
               >
                  <span
                     style={{
                        fontSize:
                           answer.length === 0
                              ? '1.25rem'
                              : Math.max(
                                   1,
                                   2.5 - Math.ceil(answer.length / 4) * 0.25
                                ) + 'rem',
                        opacity: answer.length === 0 ? 0.5 : 1,
                     }}
                  >{`${answer ? answer : `Type your answer ${i + 1} in the left panel.`}`}</span>
               </div>
            ))}
         </div>
      </section>
   );
}

export default QuestionDisplay;
