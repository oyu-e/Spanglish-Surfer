
if (!window.isContentScriptInitialized) {
  window.isContentScriptInitialized = true;
  // Fill in the blank
  var isQuestion = false;

  // Confirm button
  var toPrompt = false;


  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.active) {
      console.log("Extension activated");
      isExtensionActive = true;
      document.addEventListener("mouseup", getLocation);
      addStaticFeedbackButton();

    } else {
      console.log("Extension deactivated");
      isExtensionActive = false;
      document.removeEventListener("mouseup", getLocation);
      removeStaticFeedbackButton();
    }
  });


  // Function to create and append the spinner dynamically
  function addSpinner() {
    const spinnerContainer = document.createElement("div");
    spinnerContainer.id = "spinner"; // Assign an ID for styling and control
    spinnerContainer.style.display = "none"; // Initially hidden
    spinnerContainer.style.position = "fixed";
    spinnerContainer.style.top = "50%";
    spinnerContainer.style.left = "50%";
    spinnerContainer.style.transform = "translate(-50%, -50%)";
    spinnerContainer.style.zIndex = "10000"; // Ensure it appears on top of other elements

    // Spinner element
    const spinner = document.createElement("div");
    spinner.style.border = "8px solid #f3f3f3"; // Light gray
    spinner.style.borderTop = "8px solid #4caf50"; // Green
    spinner.style.borderRadius = "50%";
    spinner.style.width = "50px";
    spinner.style.height = "50px";
    spinner.style.animation = "spin 1s linear infinite";

    // Append spinner to the container
    spinnerContainer.appendChild(spinner);

    // Inject spinner into the webpage
    document.body.appendChild(spinnerContainer);

    // Inject spinner CSS
    const style = document.createElement("style");
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  // Function to show the spinner
  function showSpinner() {
    const spinner = document.getElementById("spinner");
    if (spinner) {
      spinner.style.display = "block";
    }
  }

  // Function to hide the spinner
  function hideSpinner() {
    const spinner = document.getElementById("spinner");
    if (spinner) {
      spinner.style.display = "none";
    }
  }

  // Add the spinner to the page when the content script runs
  addSpinner();


  // content.js
  function addButton(position) {
    // Prevent duplicate buttons
    if (document.querySelector(".highlight-confirm-button")) {
        console.log("Button already exists, skipping creation.");
        return;
    }

    const button = document.createElement("button");
    button.innerText = "Confirm Translation";
    button.className = "highlight-confirm-button";
    button.style.position = "absolute";
    button.style.top = `${position.top - 40}px`;
    button.style.left = `${position.left}px`;
    button.style.zIndex = 10000;
    button.style.backgroundColor = "#4CAF50";
    button.style.color = "white";
    button.style.border = "none";
    button.style.padding = "8px 12px";
    button.style.borderRadius = "5px";
    button.style.cursor = "pointer";
    button.addEventListener("mouseup", (event) => {
      event.stopPropagation();
    });

    button.onclick = () => {
      isQuestion = true;
      console.log("Translation confirmed!");
      handleTextSelection(position);
    };
    document.body.appendChild(button);
    console.log("Button added:", button);
  }


  // Get location of highlighting
  function getLocation() {
    console.log("getLocation called. isExtensionActive:", isExtensionActive, "isQuestion:", isQuestion, "toPrompt:", toPrompt);

    if (isExtensionActive && !isQuestion && !toPrompt) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const text = selection.toString().trim();
            if (text.length > 0) {
                console.log("Valid selection detected. Adding button.");
                toPrompt = true;
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                addButton({
                    top: rect.top + window.scrollY,
                    left: rect.left + window.scrollX,
                });
                return;
            }
        }
    }

    else if (toPrompt) {
        console.log("No valid selection or click-off detected. Removing button.");
        const buttons = document.querySelectorAll(".highlight-confirm-button");
        buttons.forEach(button => {
            console.log("Removing button:", button);
            button.remove();
        });

        if (buttons.length > 0) {
            console.log("Button(s) removed successfully.");
        } else {
            console.log("No buttons found to remove.");
        }
        toPrompt = false;
    }
  }


  async function handleTextSelection(position) {
    if (isExtensionActive) {
      document.querySelectorAll(".highlight-confirm-button").forEach(button => {
        console.log("Removing button for handleTextSelection():", button); // Confirm the button exists
        button.remove(); // Remove it
      });

      const selectedText = window.getSelection()?.toString().trim();
      if (selectedText) {
        console.log("Highlighted text:", selectedText);
        // Insert the translated text with input boxes
        const range = window.getSelection()?.getRangeAt(0);
        
        try {
          showSpinner();
          // Send the selected text to the Python server
          const response = await fetch('https://iw-s07.onrender.com', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sentence: selectedText })
          });

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          
          // Await the parsed JSON response
          const data = await response.json();
        
          console.log("Translated text:", data.translated_text);
          console.log("Omitted verbs:", data.omitted_verb);
          console.log("data: ", data.info);
          console.log("original sentence: ", data.original_text);
          console.log("error: ", data.error);


          // Exit early if no translated text
          // I want the text to be where the confirm translation button was

          if (!data.translated_text || data.translated_text.length === 0) {
            writeError(data.error, position); 
            isQuestion = false;
            toPrompt = false;
            return
          }
          // Insert the translated text with input boxes
          if (range) {
            const span = document.createElement("span");
            span.innerHTML = data.translated_text;
            // span.dataset.original = data.original_text; // Store original text
            // span.dataset.togglable = "false"; // Initially not togglable
            // span.style.cursor = "default"; // Not interactive yet

            range.deleteContents();
            range.insertNode(span);
            // No verbs detected
            if (Array.isArray(data.omitted_verb) && data.omitted_verb.length === 0) {
              span.style.color = "blue"; // Set text color to blue
              writeError(data.error, position)
              isQuestion = false;
              toPrompt = false;
            } else {
              // Add event listeners to dynamically created input boxes
              const inputBoxes = document.querySelectorAll(".verb-input"); // Use class selector
              inputBoxes.forEach(inputBox => {
                inputBox.addEventListener("keydown", checkAnswer);
              });
            }
          }
        } catch (error) {
          console.error("Error fetching translation:", error);
        } finally {
          // Hide the spinner
          hideSpinner();
        }
      }
    }
  }

  function writeError(error, position) {
    // Check if the position and error message are valid
    if (!position || !error) {
      console.error("Invalid position or error message.");
      return;
    }

    // Create the error popup element
    const errorPopup = document.createElement("div");
    errorPopup.innerText = error;
    errorPopup.style.position = "absolute";
    errorPopup.style.backgroundColor = "rgba(255, 0, 0, 0.8)";
    errorPopup.style.color = "white";
    errorPopup.style.padding = "5px 10px";
    errorPopup.style.borderRadius = "5px";
    errorPopup.style.fontSize = "12px";
    errorPopup.style.zIndex = "10000"; // Match the zIndex of the confirm button

    // Set the popup's position relative to the confirm button
    errorPopup.style.top = `${position.top - 40}px`; 
    errorPopup.style.left = `${position.left}px`;

    // Append the popup to the body
    document.body.appendChild(errorPopup);

    // Automatically remove the popup after 3 seconds
    setTimeout(() => {
      document.body.removeChild(errorPopup);
    }, 3000);
  }



  // Write function to check the accuracy of the input --> every input box has an id of "input-{ans}" therefore the correct ans can be compared to this
  // If correct --> highlight the input box green, else highlight the box red
  function checkAnswer(event) {
    const inputElement = event.target;
    const correctAnswer = inputElement.dataset.answer;
    const userAnswer = inputElement.value.trim().toLowerCase();

    // Check if the Enter key was pressed
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent default form submission behavior

      if (userAnswer === correctAnswer) {
        inputElement.style.backgroundColor = "lightgreen"; // Highlight green if correct
      } else {
        inputElement.style.backgroundColor = "lightcoral"; // Highlight red if incorrect
      }

      // Check if all inputs are correct after pressing Enter
      if (areAllAnswersCorrect()) {
        finalizeQuestion();
      }
    }
  }

  // Function to check if all input boxes have the correct answers
  function areAllAnswersCorrect() {
    const inputs = document.querySelectorAll(".verb-input");
    for (let input of inputs) {
      const correctAnswer = input.dataset.answer;
      const userAnswer = input.value.trim();
      if (userAnswer !== correctAnswer) {
        return false;
      }
    }
    return true;
  }

  // Function to replace input boxes with the correct answers and remove them
  function finalizeQuestion() {
    isQuestion = false;
    // const spans = document.querySelectorAll("[data-original]"); // Select spans with original text stored

    // spans.forEach(span => {
    //   span.dataset.togglable = "true"; // Allow toggling
    //   span.style.cursor = "pointer"; // Indicate interactivity
    //   span.style.textDecoration = "underline"; // Add underline

    //   // Add click event to toggle between original and translated text
    //   span.addEventListener("click", () => {
    //     if (span.dataset.togglable === "true") {
    //       const currentText = span.innerHTML;
    //       span.innerHTML = span.dataset.original;
    //       span.dataset.original = currentText; // Swap the text
    //     }
    //   });
    // });
    const inputs = document.querySelectorAll(".verb-input");

    inputs.forEach(input => {
      const correctAnswer = input.dataset.answer;

      // Create a span element with the correct answer
      let span = createUnderlinedText(correctAnswer, input);

      // Replace the input box with the span
      const parentNode = input.parentNode;
      parentNode.style.color = "blue"; // Optionally change text color
      parentNode.replaceChild(span, input);

      // Remove the word and parenthesis that follow the input box
      const siblingNode = span.nextSibling; // Get the next sibling after the input
      if (siblingNode && siblingNode.nodeType === Node.TEXT_NODE) {
        const updatedText = siblingNode.textContent.replace(/\(\w+\)/, ""); // Remove the pattern (word)
        siblingNode.textContent = updatedText; // Update the text node
      }
    });

    console.log("All answers are correct! Finalizing question.");
  }

  // Create the underlined text element
  function createUnderlinedText(textContent, inputElement) {
    // Create the container span
    const span = document.createElement("span");
    span.textContent = textContent;

    // Apply inline styles for the underlined text
    span.style.textDecoration = "underline";
    span.style.position = "relative";
    span.style.cursor = "pointer";

    // Extract details from the input element's dataset
    const mood = inputElement.dataset.mood || "N/A";
    const tense = inputElement.dataset.tense || "N/A";
    const person = inputElement.dataset.person || "N/A";

    // Add hover behavior for the bubble
    span.addEventListener("mouseenter", () => {
      const bubble = document.createElement("div");
      bubble.textContent = `El modo: ${mood}, El tiempo: ${tense}, ${person}`;
      bubble.style.position = "absolute";
      bubble.style.top = "-25px"; // Position above the text
      bubble.style.left = "0";
      bubble.style.backgroundColor = "#f9f9f9";
      bubble.style.color = "#333";
      bubble.style.padding = "5px 10px";
      bubble.style.borderRadius = "5px";
      bubble.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.2)";
      bubble.style.whiteSpace = "nowrap";
      bubble.style.fontSize = "12px";
      bubble.style.fontFamily = "Arial, sans-serif";
      bubble.style.zIndex = "1000";

      // Add a unique class or data attribute for identification (optional)
      bubble.className = "hover-bubble";
      span.appendChild(bubble);
    });

    // Remove the bubble when hover ends
    span.addEventListener("mouseleave", () => {
      const bubble = span.querySelector(".hover-bubble");
      if (bubble) {
        bubble.remove();
      }
    });

    return span;
  };

  function openFeedbackPopup() {
    isQuestion = true;

    const popup = document.createElement("div");
    popup.className = "feedback-popup";
    popup.style.position = "fixed";
    popup.style.top = "50%";
    popup.style.left = "50%";
    popup.style.transform = "translate(-50%, -50%)";
    popup.style.backgroundColor = "white";
    popup.style.padding = "20px";
    popup.style.borderRadius = "10px";
    popup.style.boxShadow = "0 0 10px rgba(0,0,0,0.5)";
    popup.style.zIndex = "10000";
    popup.style.width = "300px";
    popup.style.maxWidth = "80%";

    popup.innerHTML = `
        <div style="position: relative;">
            <button id="closePopupButton" style="
                position: absolute;
                top: 10px;
                right: 10px;
                background: none;
                border: none;
                font-size: 24px; /* Larger font size */
                font-weight: bold;
                color: #333;
                cursor: pointer;
                padding: 5px; /* Add padding for easier clicking */
                line-height: 1; /* Ensures proper alignment of the 'X' */
            ">&times;</button>
            <h3>Feedback</h3>
            <label>How satisfied were you with this question?</label><br>
            <select id="satisfaction">
                <option value="happy">😊 Happy</option>
                <option value="neutral">😐 Neutral</option>
                <option value="sad">😞 Sad</option>
            </select><br><br>
            <label>What was the question?</label><br>
            <textarea id="question" placeholder="Enter the question"></textarea><br><br>
            <label>What was the correct answer?</label><br>
            <textarea id="correctAnswer" placeholder="Enter the correct answer"></textarea><br><br>
            <label>What was your answer and why?</label><br>
            <textarea id="yourAnswer" placeholder="Enter your answer"></textarea><br><br>
            <button id="submitFeedbackButton">Submit</button>
        </div>
    `;

    document.body.appendChild(popup);

    // Add click event listeners for the "X" and submit button
    document.getElementById("closePopupButton").addEventListener("click", closeFeedbackPopup);
    document.getElementById("submitFeedbackButton").addEventListener("click", submitFeedback);
  }

  function closeFeedbackPopup() {
    const popup = document.querySelector(".feedback-popup");
    if (popup) {
      popup.remove();
    }
  }



  function submitFeedback() {
    const satisfaction = document.getElementById("satisfaction").value;
    const question = document.getElementById("question").value;
    const correctAnswer = document.getElementById("correctAnswer").value;
    const yourAnswer = document.getElementById("yourAnswer").value;

    // Send the data to the server
    fetch('http://localhost:8081/store-feedback', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ satisfaction, question, correctAnswer, yourAnswer }),
    }).then(response => response.json())
      .then(data => {
          alert("Feedback submitted successfully!");
          closeFeedbackPopup();
      })
      .catch(error => {
          console.error("Error submitting feedback:", error);
          alert("Failed to submit feedback.");
      });
    isQuestion = false;
  }

  // Add a static feedback button
  function addStaticFeedbackButton() {
    // Check if the button already exists
    if (document.querySelector(".static-feedback-button")) {
      console.log("Feedback button already exists. Skipping creation.");
      return;
    }

    // Create the feedback button
    const feedbackButton = document.createElement("button");
    feedbackButton.innerText = "?";
    feedbackButton.className = "static-feedback-button";
    feedbackButton.style.position = "fixed";
    feedbackButton.style.top = "10px";
    feedbackButton.style.right = "10px";
    feedbackButton.style.backgroundColor = "#007BFF";
    feedbackButton.style.color = "white";
    feedbackButton.style.border = "none";
    feedbackButton.style.borderRadius = "5px";
    feedbackButton.style.padding = "10px 15px";
    feedbackButton.style.fontSize = "16px";
    feedbackButton.style.cursor = "pointer";
    feedbackButton.style.zIndex = "10000"; // Ensure it stays above other elements

    // Add click event to open the feedback popup
    feedbackButton.onclick = () => openFeedbackPopup();

    // Append the button to the body
    document.body.appendChild(feedbackButton);
  }


  // Function to remove the feedback button
  function removeStaticFeedbackButton() {
    const feedbackButton = document.querySelector(".static-feedback-button");
    if (feedbackButton) {
      feedbackButton.remove();
      console.log("Feedback button removed.");
    }
  }
}