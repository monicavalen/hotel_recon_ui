import React from 'react'
import SelectingPage from './selecting/App'
// import TablePage from './TablePage/App'
import OutputTable from './outputTable/App'
import FuzzyTable from './fuzzyTable/App'
import { BrowserRouter, Routes, Route} from 'react-router-dom';


const App = () => {
  return (
    <BrowserRouter>
    <Routes>
        <Route path="/selecting" element={<SelectingPage/>} />
         
         <Route path='/outputTable' element={<OutputTable/>}/>
        <Route path='/fuzzyTable' element={<FuzzyTable/>}/> 


    </Routes>
    </BrowserRouter>
  )
}

export default App;
// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import { Worker, Viewer } from '@react-pdf-viewer/core';
// import '@react-pdf-viewer/core/lib/styles/index.css';
// import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
// import '@react-pdf-viewer/default-layout/lib/styles/index.css';
// const FileViewer = ({ fileUrl }) => {
//   const [fileType, setFileType] = useState(null);
//   const defaultLayoutPluginInstance = defaultLayoutPlugin();
//   useEffect(() => {
//     const fetchFileType = async () => {
//       try {
//         const response = await axios.head(fileUrl);
//         const contentType = response.headers['content-type'];
//         if (contentType.includes('pdf')) {
//           setFileType('pdf');
//         } else if (contentType.startsWith('image/')) {
//           setFileType('image');
//         } else {
//           setFileType('unsupported');
//         }
//       } catch (error) {
//         console.error('Error fetching file type:', error);
//         setFileType('error');
//       }
//     };
//     fetchFileType();
//   }, [fileUrl]);
//   if (fileType === 'pdf') {
//     return (
//       <div style={{ height: '750px' }}>
//         <Worker workerUrl={`https://unpkg.com/pdfjs-dist@2.7.570/build/pdf.worker.min.js`}>
//           <Viewer
//             fileUrl={fileUrl}
//             plugins={[defaultLayoutPluginInstance]}
//           />
//         </Worker>
//       </div>
//     );
//   } else if (fileType === 'image') {
//     return (
//       <div style={{ textAlign: 'center' }}>
//         <img src={fileUrl} alt="File" style={{ maxWidth: '100%', height: 'auto' }} />
//       </div>
//     );
//   } else if (fileType === 'unsupported') {
//     return <p>Unsupported file type</p>;
//   } else if (fileType === 'error') {
//     return <p>Error loading file</p>;
//   } else {
//     return <p>Loading...</p>;
//   }
// };
// const App = () => {
//   const fileUrl = 'https://sap-invoices-2.s3.ap-south-1.amazonaws.com/test/gWgvMH5BKvAQ4ZsN09RqSRHxIE6WJmZL4.pdf';
//   return (
//     <div>
//       <h1>File Viewer</h1>
//       <FileViewer fileUrl={fileUrl} />
//     </div>
//   );
// };
// export default App;