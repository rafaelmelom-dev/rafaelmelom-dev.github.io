const outputReference = document.getElementById("output-reference");

// Making objects
// Helper functions to create form items

function createFormItem(id, labelText, inputType = "number") {
  const wrapper = document.createElement("div");
  wrapper.classList.add("item");
  wrapper.classList.add("input-group");

  const label = document.createElement("label");
  label.classList.add("input-group-text");
  label.htmlFor = id;
  label.textContent = labelText;

  const input = document.createElement("input");
  input.classList.add("form-control");
  input.type = inputType;
  input.id = id;
  input.name = id;

  wrapper.appendChild(label);
  wrapper.appendChild(input);

  return wrapper;
}

function createFormItemWithSubselect(
  id,
  labelText,
  freqsArray,
  inputType = "number",
) {
  const wrapper = createFormItem(id, labelText, inputType);

  const select = document.createElement("select");
  select.classList.add("form-select");

  for (const [name, format] of freqsArray) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = format;
    select.appendChild(option);
  }

  wrapper.appendChild(select);

  return wrapper;
}

// References
const periods = [
  "day",
  "month",
  "trimester",
  "quadrimester",
  "semester",
  "annual",
];

const periodsTranslated = {
  day: "dia",
  month: "mes",
  trimester: "trimestre",
  quadrimester: "quadrimester",
  semester: "semestre",
  annual: "ano",
};

const timeReference = periods.map((element) => {
  return [element, element.charAt(0)];
});

const rateReference = periods.map((element) => {
  return [element, `%a${element.charAt(0)}`];
});

const formInputs = {
  capital: createFormItem("capital", "Capital:"),
  montante: createFormItem("montante", "Montante:"),
  juros: createFormItem("juros", "Juros:"),
  taxa: createFormItemWithSubselect("taxa", "Taxa:", rateReference),
  tempo: createFormItemWithSubselect("tempo", "Tempo:", timeReference),
};

// Adding objects with website loading

document.addEventListener("DOMContentLoaded", () => {
  const inputEntry = document.getElementById("input-entry");
  const targetValue = document.getElementById("output-reference").value;

  for (let [key, value] of Object.entries(formInputs)) {
    if (key != targetValue) {
      inputEntry.appendChild(value);
    }
  }
});

// Adding objects with reference changing

outputReference.addEventListener("change", (event) => {
  const inputEntry = document.getElementById("input-entry");
  const targetValue = event.target.value;

  inputEntry.replaceChildren();

  for (let [key, value] of Object.entries(formInputs)) {
    if (key != targetValue) {
      inputEntry.appendChild(value);
    }
  }
});

// Converting time and rate to daily
const TIME_CONVERSION = {
  day: { rate: 1 },
  month: { rate: 30 },
  trimester: { rate: 90 },
  quadrimester: { rate: 120 },
  semester: { rate: 180 },
  annual: { rate: 360 },
};

function convertRateToDayReference(reference, value) {
  value /= TIME_CONVERSION[reference]?.rate ?? 1;
  return value;
}

function convertTimeToDayReference(reference, value) {
  value *= TIME_CONVERSION[reference]?.rate ?? 1;
  return value;
}

// Helper function to get form values

function getFormValues() {
  let capital = parseFloat(formInputs.capital.lastChild.value.trim());
  let montante = parseFloat(formInputs.montante.lastChild.value.trim());
  let juros = parseFloat(formInputs.juros.lastChild.value.trim());
  let taxa = parseFloat(formInputs.taxa.children[1].value.trim());
  let taxaReference = formInputs.taxa.children[2].value;
  let tempo = parseFloat(formInputs.tempo.children[1].value.trim());
  let tempoReference = formInputs.tempo.children[2].value;

  taxa = convertRateToDayReference(taxaReference, taxa) / 100;

  tempo = convertTimeToDayReference(tempoReference, tempo);

  return {
    capital: capital,
    montante: montante,
    juros: juros,
    taxa: taxa,
    tempo: tempo,
  };
}

// Helper function to update result

function updateResult(value, targetValue, divIdentifier = "result") {
  const resultObj = document.getElementById(divIdentifier);

  if (value == null) {
    resultObj.textContent = "Valores insuficientes";
  } else {
    if (targetValue == "conv") {
      resultObj.textContent = "Resultado: " + (value * 100).toFixed(2) + "%";
    } else if (targetValue != "taxa" && targetValue != "tempo") {
      resultObj.textContent = "Resultado: R$" + value.toFixed(2);
    } else if (targetValue == "taxa") {
      let resultObjText = "Resultado: ";

      resultObjText += timeReference
        .map((element) => {
          return `${(value * (TIME_CONVERSION[element[0]]?.rate ?? 1) * 100).toFixed(2)}%a${element[1]}`;
        })
        .join(" ou ");

      resultObj.textContent = resultObjText;
    } else if (targetValue == "tempo") {
      let resultObjText = "Resultado: ";

      resultObjText += timeReference
        .map((element) => {
          return `${(value / (TIME_CONVERSION[element[0]]?.rate ?? 1)).toFixed(2)} ${periodsTranslated[element[0]]}(s)`;
        })
        .join(" ou ");

      resultObj.textContent = resultObjText;
    }
  }
}

function updateFormula(formula, divIdentifier = "formula-indication") {
  const formulaIndication = document.getElementById(divIdentifier);
  formulaIndication.replaceChildren();

  const formulaParagraph = document.createElement("p");
  formulaParagraph.classList.add("alert");
  formulaParagraph.classList.add("alert-primary");
  formulaParagraph.textContent = "Fórmula utilizada: ";

  const formulaSpan = document.createElement("span");
  formulaSpan.style.fontSize = "2rem";

  if (formula == null) {
    formulaIndication.replaceChildren();
  } else {
    formulaSpan.innerHTML = formula ?? "ERROR";
    MathJax.typesetPromise([`#${divIdentifier} > p > span`]);
    formulaParagraph.appendChild(formulaSpan);
    formulaIndication.appendChild(formulaParagraph);
  }
}

// Calculate button event

document.getElementById("calculate-confirm").addEventListener("click", () => {
  const targetValue = outputReference.value;
  const formValues = getFormValues();

  let formula;
  let result;

  if (targetValue == "capital") {
    if (!isNaN(formValues.montante) && !isNaN(formValues.juros)) {
      result = formValues.montante - formValues.juros;
      formula = "\\( C = M - J \\)";
    } else if (isNaN(formValues.tempo) || isNaN(formValues.taxa)) {
      result = null;
    } else if (!isNaN(formValues.montante)) {
      result = formValues.montante / (1 + formValues.taxa * formValues.tempo);
      formula = "\\( C = \\frac{M}{1 + i \\times n} \\)";
    } else if (!isNaN(formValues.juros)) {
      result = formValues.juros / (formValues.taxa * formValues.tempo);
      formula = "\\( C = \\frac{J}{i \\times n} \\)";
    } else {
      result = null;
    }
  } else if (targetValue == "montante") {
    if (isNaN(formValues.capital)) {
      return null;
    } else if (!isNaN(formValues.juros)) {
      result = formValues.capital + formValues.juros;
      formula = "\\( M = C + J \\)";
    } else if (!isNaN(formValues.taxa) && !isNaN(formValues.tempo)) {
      result = formValues.capital * (1 + formValues.taxa * formValues.tempo);
      formula = "\\( M = C \\times \( 1 + i \\times n \) \\)";
    } else {
      result = null;
    }
  } else if (targetValue == "juros") {
    if (isNaN(formValues.capital)) {
      result = null;
    } else if (!isNaN(formValues.montante)) {
      result = formValues.montante - formValues.capital;
      formula = "\\( J = M - C \\)";
    } else if (!isNaN(formValues.taxa) && !isNaN(formValues.tempo)) {
      result = formValues.capital * formValues.taxa * formValues.tempo;
      formula = "\\( J = C \\times i \\times n \\)";
    } else {
      result = null;
    }
  } else if (targetValue == "taxa") {
    if (isNaN(formValues.capital) || isNaN(formValues.tempo)) {
      result = null;
    } else if (!isNaN(formValues.juros)) {
      result = formValues.juros / (formValues.capital * formValues.tempo);
      formula = "\\( i = \\frac{J}{C \\times n} \\)";
    } else if (!isNaN(formValues.montante)) {
      result =
        (formValues.montante / formValues.capital - 1) / formValues.tempo;
      formula = "\\( i = \\frac{\\frac{M}{C} - 1}{n} \\)";
    } else {
      result = null;
    }
  } else if (targetValue == "tempo") {
    if (isNaN(formValues.capital) || isNaN(formValues.taxa)) {
      result == null;
    } else if (!isNaN(formValues.juros)) {
      result = formValues.juros / (formValues.capital * formValues.taxa);
      formula = "\\( n = \\frac{J}{C \\times i} \\)";
    } else if (!isNaN(formValues.montante)) {
      result = (formValues.montante / formValues.capital - 1) / formValues.taxa;
      formula = "\\( n = \\frac{\\frac{M}{C} - 1}{i} \\)";
    } else {
      result = null;
    }
  }

  updateResult(result, targetValue);
  updateFormula(formula);
});

// Conversion part

function getConvFormValues() {
  let tempo = document.getElementById("tempo-conv").value.trim();
  let taxaEfetiva =
    parseFloat(document.getElementById("taxa-efetiva").value.trim()) / 100;
  let taxaDescontoComercial =
    parseFloat(
      document.getElementById("taxa-desconto-comercial").value.trim(),
    ) / 100;

  return {
    tempo: tempo,
    taxaEfetiva: taxaEfetiva,
    taxaDescontoComercial: taxaDescontoComercial,
  };
}

document.getElementById("converter-confirm").addEventListener("click", () => {
  let formula;
  let result;
  let formValues = getConvFormValues();

  if (isNaN(formValues.tempo)) {
    result = null;
  } else if (!isNaN(formValues.taxaDescontoComercial)) {
    result =
      formValues.taxaDescontoComercial /
      (1 - formValues.taxaDescontoComercial * formValues.tempo);
    formula = "\\( i = \\frac{i_c}{1 - i_c \\times n} \\)";
  } else if (!isNaN(formValues.taxaEfetiva)) {
    result =
      formValues.taxaEfetiva / (1 + formValues.taxaEfetiva * formValues.tempo);
    formula = "\\( i_c = \\frac{i}{1 + i \\times n} \\)";
  } else {
    result = null;
  }

  updateResult(result, "conv", "result-conv");
  updateFormula(formula, "formula-indication-rates");
});
