/**
 * NEURALTWIN Chat Export Utility
 * 대화 내용을 .md / .pdf / .docx 포맷으로 내보내기
 */

import { saveAs } from 'file-saver';

interface ExportMessage {
  role: 'user' | 'assistant';
  content: string;
}

// 타임스탬프 생성
function getTimestamp(): string {
  const now = new Date();
  return now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
}

function getFileTimestamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${y}${m}${d}_${h}${min}`;
}

// =============================================
// Markdown Export
// =============================================

export function exportAsMarkdown(messages: ExportMessage[]): void {
  const lines: string[] = [
    `# NEURALTWIN 대화 기록`,
    ``,
    `> 내보내기 시각: ${getTimestamp()}`,
    `> 메시지 수: ${messages.length}개`,
    ``,
    `---`,
    ``,
  ];

  for (const msg of messages) {
    const label = msg.role === 'user' ? '**사용자**' : '**NEURAL**';
    lines.push(`### ${label}`);
    lines.push(``);
    lines.push(msg.content);
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
  saveAs(blob, `neuraltwin_chat_${getFileTimestamp()}.md`);
}

// =============================================
// PDF Export (jsPDF)
// =============================================

export async function exportAsPDF(messages: ExportMessage[]): Promise<void> {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('NEURALTWIN Chat Export', margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(`Exported: ${getTimestamp()} | Messages: ${messages.length}`, margin, y);
  y += 10;

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Messages
  for (const msg of messages) {
    const label = msg.role === 'user' ? '[User]' : '[NEURAL]';

    // Check page overflow
    if (y > 270) {
      doc.addPage();
      y = margin;
    }

    // Label
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(msg.role === 'user' ? 60 : 0, msg.role === 'user' ? 60 : 120, msg.role === 'user' ? 60 : 100);
    doc.text(label, margin, y);
    y += 5;

    // Content - split into lines
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);

    const lines = doc.splitTextToSize(msg.content, contentWidth);
    for (const line of lines) {
      if (y > 275) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 5;
    }

    y += 5;

    // Divider between messages
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
  }

  doc.save(`neuraltwin_chat_${getFileTimestamp()}.pdf`);
}

// =============================================
// DOCX Export
// =============================================

export async function exportAsDocx(messages: ExportMessage[]): Promise<void> {
  const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer, BorderStyle } = await import('docx');

  const children: InstanceType<typeof Paragraph>[] = [];

  // Title
  children.push(
    new Paragraph({
      text: 'NEURALTWIN 대화 기록',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.LEFT,
    })
  );

  // Metadata
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `내보내기 시각: ${getTimestamp()} | 메시지 수: ${messages.length}개`,
          size: 18,
          color: '888888',
          italics: true,
        }),
      ],
      spacing: { after: 300 },
    })
  );

  // Divider
  children.push(
    new Paragraph({
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      },
      spacing: { after: 200 },
    })
  );

  // Messages
  for (const msg of messages) {
    const isUser = msg.role === 'user';

    // Label
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: isUser ? '사용자' : 'NEURAL',
            bold: true,
            size: 22,
            color: isUser ? '555555' : '007A66',
          }),
        ],
        spacing: { before: 200 },
      })
    );

    // Content - split by newlines
    const contentLines = msg.content.split('\n');
    for (const line of contentLines) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              size: 20,
            }),
          ],
          spacing: { after: 60 },
        })
      );
    }

    // Separator
    children.push(
      new Paragraph({
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: 'EEEEEE' },
        },
        spacing: { after: 150 },
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `neuraltwin_chat_${getFileTimestamp()}.docx`);
}
