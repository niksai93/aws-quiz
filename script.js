
const quizContainer = document.getElementById('quiz');
const resultsContainer = document.getElementById('results');
const submitButton = document.getElementById('submit');
const nextButton = document.getElementById('next');

let myQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let wrongAnswers = [];

// --- 1. Load Questions from JSON ---
const SESSION_SIZE = 60;
const STORAGE_KEY = 'aws_quiz_pool_indices';

// Helper: Shuffle an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// --- NEW LOAD LOGIC ---
async function loadQuestions() {
    try {
        // 1. Fetch the Master List of all 1000+ questions
        const response = await fetch('./questions.json');
        const allData = await response.json();

        // 2. Check Browser Memory: "Do we have a leftover pool of indices?"
        let poolIndices = JSON.parse(localStorage.getItem(STORAGE_KEY));

        // 3. If memory is empty (First time OR we finished all questions), create a new shuffled deck
        if (!poolIndices || poolIndices.length === 0) {
            console.log("Starting a fresh cycle of all questions!");
            // Create a list of numbers [0, 1, 2, ... 1032]
            poolIndices = Array.from({length: allData.length}, (_, i) => i);
            shuffleArray(poolIndices); // Shuffle the IDs, not the huge data
        }

        // 4. Deal the cards: Take the next 60 IDs (or whatever is left)
        const countToTake = Math.min(SESSION_SIZE, poolIndices.length);
        const sessionIndices = poolIndices.slice(0, countToTake);

        // 5. Update Memory: Remove the 60 we just took and save the rest
        const remainingIndices = poolIndices.slice(countToTake);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remainingIndices));

        // 6. Build the actual question objects for THIS session
        myQuestions = sessionIndices.map(index => allData[index]);

        console.log(`Session loaded: ${myQuestions.length} questions.`);
        console.log(`Remaining in pool for next time: ${remainingIndices.length}`);

        // 7. Start the Quiz
        buildQuiz();

    } catch (error) {
        quizContainer.innerHTML = '<p>Error loading questions. Check console.</p>';
        console.error(error);
    }
}

// --- 2. Display a Single Question ---
function buildQuiz() {
    // --- NEW CODE STARTS ---
    const remaining = myQuestions.length - currentQuestionIndex;
    const progressTag = document.getElementById('progress-tag');
    progressTag.innerText = `Questions Pending: ${remaining}`;
    // --- NEW CODE ENDS ---

    if (currentQuestionIndex >= myQuestions.length) {
        showResults();
        return;
    }

    const currentQuestion = myQuestions[currentQuestionIndex];
    // Check if there is more than 1 correct answer
    const isMultiSelect = currentQuestion.answer.length > 1;
    const inputType = isMultiSelect ? 'checkbox' : 'radio';
    const hint = isMultiSelect ? '<small style="color: blue;">(Select all that apply)</small>' : '';

    const choicesHtml = currentQuestion.choices.map((choice, index) => {
        const label = String.fromCharCode(65 + index); 
        return `
            <label>
                <input type="${inputType}" name="question${currentQuestionIndex}" value="${choice}">
                ${label}. ${choice}
            </label>
        `;
    }).join('');

    quizContainer.innerHTML = `
        <div class="question">
            ${currentQuestionIndex + 1}. ${currentQuestion.question} ${hint}
        </div>
        <div class="choices">${choicesHtml}</div>
    `;

    // Logic for button text
    if (currentQuestionIndex === myQuestions.length - 1) {
        nextButton.textContent = "Finish Exam";
    } else {
        nextButton.textContent = "Next Question";
    }

    nextButton.style.display = 'none';
    submitButton.style.display = 'inline-block';
}

// --- 3. Check the User's Answer ---
function checkAnswer() {
    // Get ALL checked inputs
    const selector = `input[name=question${currentQuestionIndex}]:checked`;
    const userInputs = document.querySelectorAll(selector);
    
    // Create a list of the user's selected values
    const userAnswers = Array.from(userInputs).map(input => input.value);

    // Remove old feedback
    const feedback = quizContainer.querySelector('.feedback');
    if (feedback) feedback.remove();

    if (userAnswers.length > 0) {
        const correctAnswers = myQuestions[currentQuestionIndex].answer;
        
        // Compare arrays: Sort both and check if they match perfectly
        // (JSON.stringify is a quick way to compare two arrays)
        const isCorrect = JSON.stringify(userAnswers.sort()) === JSON.stringify(correctAnswers.sort());

        if (isCorrect) {
            score++;
            quizContainer.insertAdjacentHTML('beforeend', '<div class="feedback correct">✅ Correct!</div>');
        } else {
            // Show all correct answers
            quizContainer.insertAdjacentHTML('beforeend', `<div class="feedback incorrect">❌ Incorrect. Correct answers: ${correctAnswers.join(", ")}</div>`);
            
            wrongAnswers.push({
                question: myQuestions[currentQuestionIndex].question,
                correctAnswer: correctAnswers.join(", "),
                userChoice: userAnswers.join(", ")
            });
        }
        
        // Disable inputs
        quizContainer.querySelectorAll(`input[name=question${currentQuestionIndex}]`).forEach(input => input.disabled = true);
        
        nextButton.style.display = 'inline-block';
        submitButton.style.display = 'none';
    } else {
        alert('Please select an answer.');
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