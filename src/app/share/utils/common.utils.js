const JWT = require("jsonwebtoken");
require("dotenv").config();
const PDFExtract = require("pdf.js-extract").PDFExtract;
const pdfExtract = new PDFExtract();
const keywordExtractor = require("keyword-extractor");

/**
 * Creates a JWT token for a user
 * @param {string} userId - The user ID to encode in the token
 * @returns {string} JWT token
 */
const encodeToken = (userId) => {
  return JWT.sign(
    {
      iss: "Tai Nguyen",
      sub: userId,
      iat: new Date().getTime(),
      exp: new Date().setDate(new Date().getDate() + 3),
    },
    process.env.JWT_SECRET
  );
};

/**
 * Converts a base64 PDF file to text content
 * @param {string} file - Base64 encoded PDF file
 * @returns {Promise<Object>} Extracted PDF data
 */
const pdfToString = async (file) => {
  try {
    file = Buffer.from(file, "base64").toString("binary");
    let buffer = Buffer.from(file.split(",")[1], "base64");
    const options = {};
    const pdfData = await pdfExtract.extractBuffer(buffer, options);
    return pdfData;
  } catch (err) {
    console.error("Error extracting PDF:", err);
    throw err;
  }
};

/**
 * Extracts keywords from text and returns them in a Map
 * @param {string} text - Input text to extract keywords from
 * @returns {Map} Map of keywords with numeric keys
 */
const getAllKeyWords = (text) => {
  const options = {
    language: "english",
    remove_digits: true,
    return_changed_case: true,
    remove_duplicates: true,
  };
  const listKeyWord = keywordExtractor.extract(text, options);
  const mapListKeyWord = new Map();
  listKeyWord.forEach((keyword, index) => {
    mapListKeyWord.set(index, keyword);
  });
  return mapListKeyWord;
};

/**
 * Normalizes and flattens a string by removing special characters and diacritics
 * @param {string} string - Input string to flatten
 * @returns {string} Flattened string containing only a-z and A-Z
 */
const flatAllString = (string) => {
  let output = string
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  output = output.replace(/[đĐ]/g, (m) => (m === "đ" ? "d" : "D"));
  output = output.replace(/[^a-zA-Z]/g, "");
  return output;
};

module.exports = {
  encodeToken,
  pdfToString,
  getAllKeyWords,
  flatAllString,
};
