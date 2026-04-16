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
    <div className={`flex flex-col items-center bg-crm-surface ${showText ? 'p-4' : 'p-2'} rounded-xl`}>
      <QRCodeCanvas
        value={barcode}
        size={size}
        bgColor={"#ffffff"}
        fgColor={"#000000"}
        level={"H"}
        includeMargin={true}
      />      {showText && (
          <>
            <p className="text-crm-text font-semibold mt-2 text-center text-base md:text-lg">
                {userName}
            </p>
            <p className="text-crm-muted font-mono tracking-widest mt-1 text-base md:text-lg">
                {barcode}
            </p>
          </>
      )}
    </div>
  );
}
