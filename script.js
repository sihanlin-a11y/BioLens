// =============================================
//  BioLens — Interactive Logic
//  This file handles two things:
//    1. Switching which step panel is visible
//       when the user clicks a step button.
//    2. Grading the multiple-choice quiz and
//       showing feedback for each question.
// =============================================

// ---- CORRECT ANSWERS for the quiz ----
// Change these if you ever update the questions.
const CORRECT_ANSWERS = {
  q1: "b",  // Helicase
  q2: "c",  // Provides a starting point for DNA Polymerase
  q3: "b",  // Semi-conservative = one original + one new strand
};

// ---- EXPLANATION TEXT shown after answering ----
const EXPLANATIONS = {
  q1: {
    correct: "✅ Correct! Helicase is the enzyme that unwinds and separates the two DNA strands by breaking the hydrogen bonds between base pairs.",
    wrong:   "❌ Not quite. The correct answer is B) Helicase. It's the enzyme that acts like a 'zipper opener,' separating the two strands so copying can begin.",
  },
  q2: {
    correct: "✅ Correct! DNA Polymerase can only add nucleotides to an existing chain, so it needs a short RNA primer to latch onto before it can start copying.",
    wrong:   "❌ Not quite. The correct answer is C. A primer is a short RNA sequence built by Primase that gives DNA Polymerase a place to start.",
  },
  q3: {
    correct: "✅ Correct! 'Semi-conservative' means each of the two resulting DNA molecules keeps one original (parental) strand paired with one brand-new strand.",
    wrong:   "❌ Not quite. The correct answer is B. Semi-conservative replication means each new DNA copy has one old strand and one new strand.",
  },
};

// =============================================
//  PART 1: Step Panel Switching
// =============================================

/**
 * Shows the content panel for the given step name,
 * and marks the matching button as active.
 * @param {string} stepName - e.g. "unwinding", "priming"
 */
function showStep(stepName) {
  // Hide all content panels
  const allPanels = document.querySelectorAll(".step-content");
  allPanels.forEach((panel) => panel.classList.remove("active"));

  // Deactivate all buttons
  const allButtons = document.querySelectorAll(".step-btn");
  allButtons.forEach((btn) => btn.classList.remove("active"));

  // Show the selected panel
  const targetPanel = document.getElementById("step-" + stepName);
  if (targetPanel) {
    targetPanel.classList.add("active");
  }

  // Activate the matching button
  const targetButton = document.querySelector(`[data-step="${stepName}"]`);
  if (targetButton) {
    targetButton.classList.add("active");
  }
}

// Attach click listeners to all step buttons
document.querySelectorAll(".step-btn").forEach((button) => {
  button.addEventListener("click", function () {
    const step = this.getAttribute("data-step");
    showStep(step);
  });
});

// =============================================
//  PART 2: Quiz Grading
// =============================================

/**
 * Grades the quiz when the user clicks "Check My Answers".
 * - Marks each option label as correct or incorrect.
 * - Displays an explanation below each question.
 * - Shows a summary score banner.
 */
document.getElementById("submitQuiz").addEventListener("click", function () {
  let score = 0;
  const totalQuestions = Object.keys(CORRECT_ANSWERS).length;

  // Loop over each question
  Object.entries(CORRECT_ANSWERS).forEach(([questionId, correctValue]) => {
    const selectedInput = document.querySelector(
      `input[name="${questionId}"]:checked`
    );
    const feedbackEl = document.getElementById("feedback-" + questionId);
    const questionCard = document.getElementById(questionId);

    // Clear any previous feedback classes on option labels
    questionCard.querySelectorAll(".option").forEach((opt) => {
      opt.classList.remove("correct", "incorrect");
    });

    // Highlight the correct answer always
    const correctLabel = questionCard.querySelector(
      `input[value="${correctValue}"]`
    )?.closest(".option");
    if (correctLabel) correctLabel.classList.add("correct");

    if (!selectedInput) {
      // No answer selected for this question
      feedbackEl.textContent = "⚠️ You didn't select an answer for this question.";
      feedbackEl.className = "feedback incorrect-msg";
      return; // move to next question
    }

    const userValue = selectedInput.value;

    if (userValue === correctValue) {
      // Correct answer
      score++;
      feedbackEl.textContent = EXPLANATIONS[questionId].correct;
      feedbackEl.className = "feedback correct-msg";
    } else {
      // Wrong answer — also highlight user's pick as incorrect
      const wrongLabel = selectedInput.closest(".option");
      if (wrongLabel) wrongLabel.classList.add("incorrect");

      feedbackEl.textContent = EXPLANATIONS[questionId].wrong;
      feedbackEl.className = "feedback incorrect-msg";
    }

    // Disable all radio inputs for this question after grading
    questionCard.querySelectorAll("input[type='radio']").forEach((input) => {
      input.disabled = true;
    });
  });

  // ---- Show summary result banner ----
  const resultEl = document.getElementById("quizResult");
  const percentage = score / totalQuestions;

  if (percentage === 1) {
    resultEl.textContent = `🎉 Perfect score! ${score} / ${totalQuestions} — You nailed it!`;
    resultEl.className = "quiz-result perfect";
  } else if (percentage >= 0.5) {
    resultEl.textContent = `👍 Good effort! ${score} / ${totalQuestions} — Review the steps above to strengthen your understanding.`;
    resultEl.className = "quiz-result good";
  } else {
    resultEl.textContent = `📖 Keep studying! ${score} / ${totalQuestions} — Read through the four steps again and try once more.`;
    resultEl.className = "quiz-result tryagain";
  }

  // Hide the submit button so it can't be clicked again
  this.style.display = "none";

  // Scroll the result into view smoothly
  resultEl.scrollIntoView({ behavior: "smooth", block: "center" });
});
