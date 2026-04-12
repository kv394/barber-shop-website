'use client';

import { QRCodeCanvas } from 'qrcode.react';

interface UserQRCodeProps {
  barcode: string;
  userName?: string;
  showText?: boolean;
  size?: number;
}

export default function UserQRCode({ barcode, userName, showText = true, size = 150 }: UserQRCodeProps) {
  return (
    <div className={`flex flex-col items-center bg-white ${showText ? 'p-4' : 'p-2'} rounded-xl`}>
      <QRCodeCanvas
        value={barcode}
        size={size}
        bgColor={"#ffffff"}
        fgColor={"#000000"}
        level={"H"}
        includeMargin={true}
      />      {showText && (
          <>
            <p className="text-black font-semibold mt-2 text-sm text-center">
                {userName}
            </p>
            <p className="text-botanical-muted font-mono text-xs tracking-widest mt-1">
                {barcode}
            </p>
          </>
      )}
    </div>
  );
}
