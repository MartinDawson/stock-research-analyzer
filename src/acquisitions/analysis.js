import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';
import { createObjectCsvWriter } from 'csv-writer';

const extractId = (field) => {
  const match = field.match(/IQ(\d+)/);
  return match ? `IQ${match[1]}` : null;
};

const addMonths = (date, months) => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
};

const processData = async (inputFile, outputFile) => {
  try {
    const fileContent = await fs.readFile(inputFile, 'utf8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

    const processedRecords = records.map(row => {
      const announcedDate = new Date(row['Announced Date MM/dd/yyyy']);
      return {
        'Start Date': addMonths(announcedDate, -5).toISOString().split('T')[0],
        'End Date': addMonths(announcedDate, 30).toISOString().split('T')[0],
        'Buyer Identifier': extractId(row['SPCIQ ID (Buyer/Investor)']),
        'Buyer Market Value': 'N/A', // You'll need to implement CIQ function equivalent
        'Seller Identifier': extractId(row['SPCIQ ID (Seller)']),
        'Seller Market Value': 'N/A', // You'll need to implement CIQ function equivalent
        'Is Seller Public?': 'N/A', // You'll need to implement this logic
        'Transaction Size as % of buyer market cap': 'N/A', // You'll need to implement this calculation
        'Unique Buyer Identifier': row['SPCIQ ID (Buyer/Investor)']
      };
    });

    const csvWriter = createObjectCsvWriter({
      path: outputFile,
      header: Object.keys(processedRecords[0]).map(key => ({ id: key, title: key }))
    });

    await csvWriter.writeRecords(processedRecords);
    console.log(`Processed data written to ${outputFile}`);
  } catch (error) {
    console.error('Error processing file:', error);
  }
};

// Usage
const inputFile = 'acquisitionsUSData.csv';
const outputFile = 'processedAcquisitionsData.csv';
processData(inputFile, outputFile);