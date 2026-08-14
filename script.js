// Parse JSON data
const data = JSON.parse(item_data);

// Configure MathJax
window.MathJax = {
  tex: {
    inlineMath: {'[+]': [['@@', '@@']]}
  }
};

// Define and initiate global variables
let answerRevealed = false;
let desmosRevealed = false;
let correctAnswer = -1;
let freeResponse = false;
let questionIndex = 0;
let calculator;

// Function to obtain all question indexes for a given unit name
function getQuestionsByTopic(topic) {
    let matchingIndexes = [];
    for (let i = 0; i < data.length; i++) {
        if (data[i].unit === topic) {
            matchingIndexes.push(i);
        }
    }
    return matchingIndexes;
}

// Function to obtain all question indexes for a given difficulty
function getQuestionsByDifficulty(difficulty) {
    let matchingIndexes = [];
    for (let i = 0; i < data.length; i++) {
        if (parseInt(data[i].diff) === difficulty) {
            matchingIndexes.push(i);
        }
    }
    return matchingIndexes;
}

// Function to attempt TeX formatting on an element
function attemptTeXFormat(elem_id) {
    try {
        MathJax.typesetPromise([document.getElementById(elem_id)]);
    } catch (err) {
        console.error("MathJax typesetting failed:", err);
    }
}

// Function to update question elements to match the JSON data for a given question index
function importQuestion(data, index) {

    // Hide solution by default
    answerRevealed = false;

    // Store question index globally
    questionIndex = index;

    // Initiate variables with question data
    let unit = data[index].unit;
    let prompt = data[index].text;
    let choices = data[index].opts;

    // If no choices are present, assume question is free response
    let correct;
    freeResponse = (choices === null);
    if(freeResponse) {
        correct = data[index].crct;
    } else {
        correct = parseInt(data[index].crct);
    }
    // Store correct answer globally
    correctAnswer = correct;

    // Initiate variables with question data
    let difficulty = parseInt(data[index].diff);
    let id = data[index].id;
    let img_name = data[index].img;
    let graph_state = data[index].graph;

    // Update unit and prompt with question data
    $('#q_unit').text(unit);
    $('#q_prompt').html(prompt);
    attemptTeXFormat('q_prompt')

    if(freeResponse) {
        // If free response, only show one text element rather than a list
        $('#q_choices').addClass("hidden");
        $('#q_free_choice').removeClass("hidden");
        $('#q_free_choice').html("Free response.");
    } else {
        // If multiple choice, show a list of options as answers
        $('#q_choices').removeClass("hidden");
        $('#q_free_choice').addClass("hidden");

        // Populate the text for each option
        for(let i=1; i<=4; i++) {
            $(`#q_chc${i}`).html(choices[i-1]);
            attemptTeXFormat(`q_chc${i}`)
            $(`#q_chc${i}`).removeClass("correct_choice");
        }
    }

    // Update difficulty bar to match question data
    for(let i=1; i<=3; i++) {
        if(i <= difficulty) {
            $(`#q_dft${i}`).addClass("q_filled");
        } else {
            $(`#q_dft${i}`).removeClass("q_filled");
        }
    }

    // Update the ID text with the question's ID
    $('#q_id').text(`${id}`);

    // If the question has an associated diagram, set the image's source
    if(img_name != null) {
        $('#q_diagram').attr('src', `content/${img_name}`);
    }

    // If the question has an associated graph, set the calculator's state
    if(graph_state != null) {
        calculator.setState(graph_state);
    } else {
        //$('#q_desmos').attr('disabled', true);
        calculator.setBlank();
    }

    // Show the diagram by default
    $('#q_calculator').addClass("hidden");
    $('#q_diagram').removeClass("hidden");

    // Toggle the action button off by default
    $('#q_toggle').removeClass("toggle_on");
    $('#q_toggle').addClass("toggle_off");
    $('#q_toggle').text("REVEAL");

    console.log("Question loaded successfully.");
    return true;
}

// Function to promise to wait for the Desmos API to load, timing out on a wait too long
function waitForDesmosAPI() {
    return new Promise((resolve, reject) => {
        if (typeof Desmos !== 'undefined' && Desmos.GraphingCalculator) {
            resolve();
        } else {
            const checkInterval = setInterval(() => {
                if (typeof Desmos !== 'undefined' && Desmos.GraphingCalculator) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);

            const timeout = setTimeout(() => {
                clearInterval(checkInterval);
                reject(new Error("Desmos API failed to load within the expected time."));
            }, 5000);
        }
    });
}

// Function that runs when the DOM fully loads
$(document).ready(function() {
    let elt = document.getElementById('q_calculator');
    
    // Define and initiate a calculator variable once the Desmos API loads
    waitForDesmosAPI().then(() => {
        calculator = Desmos.GraphingCalculator(elt);
    }).catch((error) => {
        console.warn("Failed to load Desmos API:", error);
    });

    // Function to handle action button clicks, showing or hiding the question answer
    $("#q_toggle").on("click", function() {

        // Validate variable
        if(questionIndex < 0 || questionIndex >= data.length) {
            console.error("Invalid question index.");
            return;
        }

        if(answerRevealed) {
            // If the answer is currently visible, hide it
            $('#q_toggle').removeClass("toggle_on");
            $('#q_toggle').addClass("toggle_off");
            $('#q_toggle').text("REVEAL");

            if(freeResponse) { // Free response
                $('#q_free_choice').text("Free response.");
                $(`#q_free_choice`).removeClass("correct_choice");

            } else { // Multiple choice
                $(`#q_chc${correctAnswer}`).removeClass("correct_choice");

            }
            
        } else {
            // Otherwise, the answer is currently hidden, so show it
            $('#q_toggle').removeClass("toggle_off");
            $('#q_toggle').addClass("toggle_on");
            $('#q_toggle').text("HIDE");

            if(freeResponse) { // Free response
                $('#q_free_choice').html(`Answer: ${correctAnswer}`);
                attemptTeXFormat('q_free_choice');
                $(`#q_free_choice`).addClass("correct_choice");

            } else { // Multiple choice
                $(`#q_chc${correctAnswer}`).addClass("correct_choice");
                
            }

        }
        answerRevealed = !answerRevealed; // Toggle the variable
    });

    // Function to handle Desmos button clicks, showing or hiding the graph
    $("#q_desmos").on("click", function() {
        console.log(JSON.stringify(calculator.getState())); // Debug purposes
        
        if(desmosRevealed) {
            // If the graph is currently visible, hide it
            $('#q_diagram').removeClass("hidden");
            $('#q_calculator').addClass("hidden");

        } else {
            // Otherwise the graph is currently hidden, so show it
            $('#q_diagram').addClass("hidden");
            $('#q_calculator').removeClass("hidden");

        }
        desmosRevealed = !desmosRevealed; // Toggle the variable
    });

    // Function to handle topic clicks, opening a question of a given topic
    $(".c_topic").on("click", function() {
        let topic = $(this).text();

        // Obtain question indexes for the topic
        let questions = getQuestionsByTopic(topic);

        // Choose a random question index
        let randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        //let randomQuestion = questions[0]; // Debug purposes

        // Validate the calculator
        if(!calculator) {
            alert("Desmos API failed to load. Please refresh the page and try again.");
            return;
        }

        // Import and show the question
        if(randomQuestion && questions && questions.length > 0) {
            let ready = importQuestion(data, randomQuestion);
            $('#question_bucket').removeClass("hidden");
            $('#contents_bucket').addClass("hidden");
        }
    });

});