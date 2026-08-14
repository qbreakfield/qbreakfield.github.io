window.MathJax = {
  tex: {
    inlineMath: {'[+]': [['@@', '@@']]}
  }
};

const data = JSON.parse(item_data);
let answerRevealed = false;
let desmosRevealed = false;
let correctAnswer = -1;
let freeResponse = false;
let questionIndex = 0;

let calculator;

function getQuestionsByTopic(topic) {
    let matchingIndexes = [];
    for (let i = 0; i < data.length; i++) {
        if (data[i].unit === topic) {
            matchingIndexes.push(i);
        }
    }
    return matchingIndexes;
}

function getQuestionsByDifficulty(difficulty) {
    let matchingIndexes = [];
    for (let i = 0; i < data.length; i++) {
        if (parseInt(data[i].diff) === difficulty) {
            matchingIndexes.push(i);
        }
    }
    return matchingIndexes;
}

function importQuestion(data, index) {
    answerRevealed = false;
    questionIndex = index;

    let unit = data[index].unit;
    let prompt = data[index].text;
    let choices = data[index].opts;
    freeResponse = (choices === null);
    let correct;
    if(freeResponse) {
        correct = data[index].crct;
    } else {
        correct = parseInt(data[index].crct);
    }
    correctAnswer = correct;
    let difficulty = parseInt(data[index].diff);
    let id = data[index].id;
    let img_name = data[index].img;
    let graph_state = data[index].graph;

    $('#q_unit').text(unit);
    $('#q_prompt').html(prompt);
    try {
        MathJax.typesetPromise([document.getElementById('q_prompt')]);
    } catch (err) {
        console.error("MathJax typesetting failed:", err);
    }

    if(choices === null) {
        $('#i_choices').addClass("hidden");
        $('#i_free_choice').removeClass("hidden");
        $('#i_free_choice').html("Free response.");
    } else {
        $('#i_choices').removeClass("hidden");
        $('#i_free_choice').addClass("hidden");

        for(let i=0; i<4; i++) {
            $(`#chc${i+1}`).html(choices[i]);
            try {
                MathJax.typesetPromise([document.getElementById(`chc${i+1}`)]);
            } catch (err) {
                console.error("MathJax typesetting failed:", err);
            }
            $(`#chc${i+1}`).removeClass("correct_choice");
        }
    }

    for(let i=0; i<3; i++) {
        if(i < difficulty) {
            $(`#dft${i+1}`).addClass("i_filled");
        } else {
            $(`#dft${i+1}`).removeClass("i_filled");
        }
    }

    $('#i_id').text(`${id}`);

    if(img_name != null) {
        $('#i_diagram').attr('src', `content/${img_name}`);
    }

    if(graph_state != null) {
        calculator.setState(graph_state);
    } else {
        //$('#i_desmos').attr('disabled', true);
        calculator.setBlank();
    }
    $('#calculator').addClass("hidden");

    $('#i_toggle').removeClass("toggle_on");
    $('#i_toggle').addClass("toggle_off");
    $('#i_toggle').text("REVEAL");

    console.log("Question loaded successfully.");
}

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

$(document).ready(function() {
    let elt = document.getElementById('calculator');
    
    waitForDesmosAPI().then(() => {
        calculator = Desmos.GraphingCalculator(elt);
    }).catch((error) => {
        console.warn("Failed to load Desmos API:", error);
    });

    $("#i_toggle").on("click", function() {

        if(questionIndex < 0 || questionIndex >= data.length) {
            console.error("Invalid question index.");
            return;
        }

        if(answerRevealed) {
            $('#i_toggle').removeClass("toggle_on");
            $('#i_toggle').addClass("toggle_off");
            $('#i_toggle').text("REVEAL");
            answerRevealed = false;

            if(freeResponse) {
                $('#i_free_choice').text("Free response.");
                $(`#i_free_choice`).removeClass("correct_choice");
            } else {
                $(`#chc${correctAnswer}`).removeClass("correct_choice");
            }
            
        } else {
            $('#i_toggle').removeClass("toggle_off");
            $('#i_toggle').addClass("toggle_on");
            $('#i_toggle').text("HIDE");
            answerRevealed = true;

            if(freeResponse) {
                $('#i_free_choice').html(`Answer: ${correctAnswer}`);
                MathJax.typesetPromise([document.getElementById('i_free_choice')]);
                $(`#i_free_choice`).addClass("correct_choice");
            } else {
                $(`#chc${correctAnswer}`).addClass("correct_choice");
            }

        }
    });

    $("#i_desmos").on("click", function() {
        console.log(JSON.stringify(calculator.getState()));
        if(desmosRevealed) {
            $('#i_diagram').removeClass("hidden");
            $('#calculator').addClass("hidden");
            desmosRevealed = false;
        } else {
            $('#i_diagram').addClass("hidden");
            $('#calculator').removeClass("hidden");
            desmosRevealed = true;
        }
    });

    $(".c_topic").on("click", function() {
        let topic = $(this).text();
        let questions = getQuestionsByTopic(topic);
        let randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        //let randomQuestion = questions[0]; // For testing
        if(!calculator) {
            alert("Desmos API failed to load. Please refresh the page and try again.");
            return;
        }
        if(questions && questions.length > 0) {
            importQuestion(data, randomQuestion);
            $('#question_bucket').removeClass("hidden");
            $('#contents_bucket').addClass("hidden");
        }
    });

});