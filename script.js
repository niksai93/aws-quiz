// Helper function to shuffle an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
const quizContainer = document.getElementById('quiz');
const resultsContainer = document.getElementById('results');
const submitButton = document.getElementById('submit');
const nextButton = document.getElementById('next');

let myQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let wrongAnswers = [];

// --- 1. Load Questions from JSON ---
async function loadQuestions() {
    try {
        const response = await fetch('./questions.json');
        myQuestions = await response.json();
        shuffleArray(myQuestions); // <--- ADD THIS LINE
        buildQuiz();
    } catch (error) {
        quizContainer.innerHTML = '<p>Error loading questions. Check your questions.json file.</p>';
        console.error("Failed to load quiz data:", error);
    }
}

// --- 2. Display a Single Question ---
function buildQuiz() {
    if (currentQuestionIndex >= myQuestions.length) {
        showResults();
        return;
    }

    const currentQuestion = myQuestions[currentQuestionIndex];
    const choicesHtml = currentQuestion.choices.map((choice, index) => {
        // Use A, B, C, D labels for display
        const label = String.fromCharCode(65 + index); 
        return `
            <label>
                <input type="radio" name="question${currentQuestionIndex}" value="${choice}">
                ${label}. ${choice}
            </label>
        `;
    }).join('');

    quizContainer.innerHTML = `
        <div class="question">${currentQuestionIndex + 1}. ${currentQuestion.question}</div>
        <div class="choices">${choicesHtml}</div>
    `;

    // Hide the 'Next' button until an answer is submitted
    nextButton.style.display = 'none';
    submitButton.style.display = 'inline-block';
}

// --- 3. Check the User's Answer ---
function checkAnswer() {
    const selector = `input[name=question${currentQuestionIndex}]:checked`;
    const userAnswer = (quizContainer.querySelector(selector) || {}).value;

    // Remove any previous feedback
    const feedback = quizContainer.querySelector('.feedback');
    if (feedback) feedback.remove();

    if (userAnswer) {
        const correct = userAnswer === myQuestions[currentQuestionIndex].answer;
        
        if (correct) {
            score++;
            // Show Correct feedback
            quizContainer.insertAdjacentHTML('beforeend', '<div class="feedback correct">✅ Correct!</div>');
        } else {
            // Show Incorrect feedback with the correct answer
            const correctAnswer = myQuestions[currentQuestionIndex].answer;
            quizContainer.insertAdjacentHTML('beforeend', `<div class="feedback incorrect">❌ Incorrect. The answer is: ${correctAnswer}</div>`);
	// --- NEW CODE STARTS ---
            // Save the mistake for later
            wrongAnswers.push({
                question: myQuestions[currentQuestionIndex].question,
                correctAnswer: correctAnswer,
                userChoice: userAnswer
            });
            // --- NEW CODE ENDS ---
        }
        
        // Disable radio buttons after submission
        quizContainer.querySelectorAll(`input[name=question${currentQuestionIndex}]`).forEach(radio => radio.disabled = true);
        
        // Show the 'Next' button
        nextButton.style.display = 'inline-block';
        submitButton.style.display = 'none';
    } else {
        alert('Please select an answer before submitting.');
    }
}

// --- 4. Show Final Results ---
function showResults() {
    quizContainer.innerHTML = '';
    submitButton.style.display = 'none';
    nextButton.style.display = 'none';
    
    let resultsHTML = `
        <h2>Quiz Finished!</h2>
        <p>You scored ${score} out of ${myQuestions.length}.</p>
        <p>(${((score / myQuestions.length) * 100).toFixed(0)}%)</p>
    `;

    if (wrongAnswers.length > 0) {
        resultsHTML += `<h3>Review Your Mistakes:</h3>`;
        wrongAnswers.forEach((item, index) => {
            resultsHTML += `
                <div style="margin-bottom: 20px; text-align: left; background: #fff0f0; padding: 10px; border-radius: 5px;">
                    <p><strong>Q: ${item.question}</strong></p>
                    <p>Your Answer: <span style="color: red">${item.userChoice}</span></p>
                    <p>Correct Answer: <span style="color: green">${item.correctAnswer}</span></p>
                </div>
            `;
        });
    } else {
        resultsHTML += `<p style="color: green; font-weight: bold;">🎉 Perfect Score!</p>`;
    }

    resultsContainer.innerHTML = resultsHTML;
}

// --- Event Listeners ---
submitButton.addEventListener('click', checkAnswer);
nextButton.addEventListener('click', () => {
    currentQuestionIndex++;
    buildQuiz();
});

// Start the quiz
loadQuestions();
document.getElementById('finish').addEventListener('click', showResults);