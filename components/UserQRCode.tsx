'use client';

import { QRCodeCanvas } from 'qrcode.react';

interface UserQRCodeProps {
  barcode: string;
  userName?: string;
  showText?: boolean;
}

export default function UserQRCode({ barcode, userName, showText = true }: UserQRCodeProps) {
  return (
    <div className="flex flex-col items-center bg-white p-4 rounded-xl">
      <QRCodeCanvas 
        value={barcode} 
        size={150} 
        bgColor={"#ffffff"}
        fgColor={"#000000"}
        level={"H"}
        includeMargin={true}
      />
      {showText && (
          <>
            <p className="text-black font-semibold mt-2 text-sm text-center">
                {userName}
            </p>
            <p className="text-gray-500 font-mono text-xs tracking-widest mt-1">
                {barcode}
            </p>
          </>
      )}
    </div>
  );
}
