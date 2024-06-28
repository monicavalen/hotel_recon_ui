import React from 'react';
import { useState, useEffect } from 'react';
import '../selecting/Sap.css';
import { Popconfirm } from 'antd';
import axios from 'axios';

const App = () => {
  const [selectedColumn, setSelectedColumn] = useState([]);
  const [matchesData, setMatchesData] = useState([]);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBookingTable, setShowBookingTable] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/matches')
      .then(response => {
        console.log('API Response:', response.data); // Log the API response to check its structure
        setMatchesData(response.data);

        if (response.data.length > 0) {
          setCurrentDoc(createDoc(response.data[0]));
        }
      })
      .catch(error => {
        console.error('Error fetching matches data:', error);
      });
  }, []);


  const createDoc = (docData) => {
    return {
      _id: docData._id,
      s3_link:docData.s3_link,
      
      df_A: {
        // seller_name: docData.invoice_data.shipto_name,
        seller_vat_number: docData.invoice_data.supplier_gst_number,
        invoice_number: docData.invoice_data.invoice_number,
        invoice_amount: docData.invoice_data.invoice_amount,
        invoice_date: docData.invoice_data.invoice_date,
      },
      df_B: docData.Matches.map(match => ({
        trdnm: match.respective_2b_data.trdnm,
        ctin: match.respective_2b_data.ctin,
        inum: match.respective_2b_data.inum,
        val: match.respective_2b_data.val,
        dt: match.respective_2b_data.dt,
        gstin_score: match.invoiceGstin_Score,
        inv_no_score: match.invoice_Number_Score,
        amount_score: match.invoiceAmount_Score,
        date_score: match.invoiceDate_Score,
        combined_score: match.combined_score,
      })),
      booking_data: docData.booking_data
      
    };
    
  };
  

  

const getColor = (value) => {
    if (value > 80) {
        return "#388E3C";
    } else if (value >= 50 && value <= 80) {
        return "#C0CA33";
    } else {
        return "#E53935";
    }
};

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    const [day, month, year] = timestamp.split("-");
    const isoDateString = `${year}-${month}-${day}`;
    const date = new Date(isoDateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toISOString().split("T")[0];
  };

  const downloadFile = (url) => {
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleNextClick = () => {
    const nextIndex = (currentIndex + 1) % matchesData.length;
    setCurrentIndex(nextIndex);
    setCurrentDoc(createDoc(matchesData[nextIndex]));
  };

  const handlePreviousClick = () => {
    const previousIndex = (currentIndex - 1 + matchesData.length) % matchesData.length;
    setCurrentIndex(previousIndex);
    setCurrentDoc(createDoc(matchesData[previousIndex]));
  };

  const handleSkipClick = () => {
    // Implement the behavior for skipping an item (e.g., moving to the next item)
    handleNextClick();
  };

  // const handleConfirmClick = () => {
  //   // Capture the selected column data
  //   const selectedData = selectedColumn.map(index => currentDoc.df_B[index]);
    
  //   // Document ID to be sent
  //   const documentId = currentDoc._id; // Make sure currentDoc contains _id
    
  //   // Send data to backend to save to MongoDB
  //   axios.post(`http://localhost:5000/saveSelectedColumn?documentId=${documentId}`, selectedData)
  //     .then(response => {
  //       console.log('Data saved:', response.data);
  //       handleNextClick(); // Move to the next item
  //     })
  //     .catch(error => {
  //       console.error('Error saving selected column data:', error);
  //     });
  // };
  const handleConfirmClick = () => {
    // Capture the selected column data
    const selectedData = selectedColumn.map(index => currentDoc.df_B[index]);

    // Document ID to be sent
    const documentId = currentDoc._id; // Make sure currentDoc contains _id

    // Log currentDoc to ensure it contains _id
    console.log('Current Document:', currentDoc);

    if (!documentId) {
      console.error('Document ID is not defined');
      return;
    }

    // Send data to backend to save to MongoDB
    axios.post(`http://localhost:5000/saveSelectedColumn?documentId=${documentId}`, selectedData)
      .then(response => {
        console.log('Data saved:', response.data);
        handleNextClick(); // Move to the next item
      })
      .catch(error => {
        console.error('Error saving selected column data:', error);
      });
  };

  const toggleBookingTable = () => {
    setShowBookingTable(!showBookingTable);
  };
  const renderFile = (url) => {
    const fileExtension = url.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
      return <img src={url} alt="Document" style={{ maxWidth: '100%', height: 'auto' }} />;
    } else if (fileExtension === 'pdf') {
      return (
        <iframe src={url} width="100%" height="600px" title="Document">
          <p>Your browser does not support PDFs. <a href={url}>Download the PDF</a>.</p>
        </iframe>
      );
    } else {
      return <p>Unsupported file type.</p>;
    }
  };

  return (
    <div>
      <div className='container'>
      {currentDoc && currentDoc.s3_link && (
          <div style={{ marginBottom: '20px' }}>
            {renderFile(currentDoc.s3_link)}
          </div>
        )}
        <div>
          <button onClick={toggleBookingTable} style={{ position: 'absolute', bottom: '0px', right: '0px' }}>
            Booking Data
          </button>
          {showBookingTable && (
            <div>
              <table>
                <thead>
                  <tr>
                    <th>Booking Data</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Supplier</td>
                    <td>{currentDoc.booking_data.seller_name || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td>Supplier GSTIN</td>
                    <td>{currentDoc.booking_data.seller_vat_number || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td>Invoice Number</td>
                    <td>{currentDoc.booking_data.invoice_number || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td>Invoice Value</td>
                    <td>{currentDoc.booking_data.invoice_amount || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td>Invoice Date</td>
                    <td>{currentDoc.booking_data.invoice_date || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td>Location</td>
                    <td>{currentDoc.booking_data.LocName || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td>Buyer GST</td>
                    <td>{currentDoc.booking_data.buyer_vat_number || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td>Buyer address</td>
                    <td>{currentDoc.booking_data.buyer_address || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td>Employee first name</td>
                    <td>{currentDoc.booking_data.EmployeeFirstName || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td>Employee last name</td>
                    <td>{currentDoc.booking_data.EmployeeFirstName || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td>Employee ID</td>
                    <td>{currentDoc.booking_data.EmployeeID || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!showBookingTable && currentDoc && (
          <form>
            <table>
              <thead>
                <tr>
                  <th>Key</th>
                  {currentDoc.df_B.map((_, idx) => (
                    <th
                      key={idx}
                      onClick={() =>
                        selectedColumn.includes(idx)
                          ? setSelectedColumn(selectedColumn.filter((col) => col !== idx))
                          : setSelectedColumn([...selectedColumn, idx])
                      }
                      style={{ backgroundColor: selectedColumn.includes(idx) ? '#27ae60' : 'transparent' }}
                    >
                      {`2B MATCH ${idx + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {/* <span>Supplier-- </span>({currentDoc.df_A.seller_name}) */}
                      <span>Supplier</span>
                    </div>
                  </td>
                  {currentDoc.df_B.map((doc, idx) => (
                    <td key={idx} style={{ backgroundColor: selectedColumn.includes(idx) ? '#27ae60' : 'transparent' }}>
                      {doc.trdnm || 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Supplier GSTIN-- </span>({currentDoc.df_A.seller_vat_number})
                    </div>
                  </td>
                  {currentDoc.df_B.map((doc, idx) => (
                    <td key={idx} style={{ backgroundColor: selectedColumn.includes(idx) ? '#27ae60' : 'transparent' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {doc.ctin || 'N/A'}
                        <div style={{ backgroundColor: getColor(parseInt(doc.gstin_score)), color: 'white', padding: '4px 8px', borderRadius: '16px', display: 'inline-block' }}>
                          {parseInt(doc.gstin_score)}%
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Invoice Number-- </span>({currentDoc.df_A.invoice_number})
                    </div>
                  </td>
                  {currentDoc.df_B.map((doc, idx) => (
                    <td key={idx} style={{ backgroundColor: selectedColumn.includes(idx) ? '#27ae60' : 'transparent' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {doc.inum || 'N/A'}
                        <div style={{ backgroundColor: getColor(parseInt(doc.inv_no_score)), color: 'white', padding: '4px 8px', borderRadius: '16px', display: 'inline-block' }}>
                          {parseInt(doc.inv_no_score)}%
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Invoice Value </span>({currentDoc.df_A.invoice_amount})
                    </div>
                  </td>
                  {currentDoc.df_B.map((doc, idx) => (
                    <td key={idx} style={{ backgroundColor: selectedColumn.includes(idx) ? '#27ae60' : 'transparent' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {doc.val || 'N/A'}
                        <div style={{ backgroundColor: getColor(parseInt(doc.amount_score)), color: 'white', padding: '4px 8px', borderRadius: '16px', display: 'inline-block' }}>
                          {parseInt(doc.amount_score)}%
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Invoice Date </span>
                      ({formatTimestamp(currentDoc.df_A.invoice_date)})
                    </div>
                  </td>
                  {currentDoc.df_B.map((doc, idx) => (
                    <td key={idx} style={{ backgroundColor: selectedColumn.includes(idx) ? '#27ae60' : 'transparent' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ marginRight: 'auto' }}>
                          {formatTimestamp(doc.dt) || 'N/A'}
                        </span>
                        <div style={{ backgroundColor: getColor(parseInt(doc.date_score)), color: 'white', padding: '4px 8px', borderRadius: '16px', marginLeft: '5px' }}>
                          {parseInt(doc.date_score)}%
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td><strong>Total Match Score</strong></td>
                  {currentDoc.df_B.map((doc, idx) => (
                    <td key={idx} style={{ backgroundColor: selectedColumn.includes(idx) ? '#27ae60' : getColor(parseInt(doc.combined_score)) }}>
                      {doc.combined_score.toFixed(2) || 'N/A'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
            <button type="button" onClick={handlePreviousClick}>Previous</button>
            <button type="button" onClick={handleSkipClick}>SKIP</button>
            <Popconfirm
              title="Confident?"
              description="Are you sure about this match"
              okText="Yes"
              cancelText="No"
              onConfirm={handleConfirmClick}
            >
              <button type="button">Next</button>
            </Popconfirm>
          </form>
        )}
      </div>
    </div>
  );
}

export default App;