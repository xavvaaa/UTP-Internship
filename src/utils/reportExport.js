import { BRAND_NAME } from '../constants/brand'

const MIME = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

export function downloadReportPdf(report) {
  downloadBlob(`${report.fileBaseName}.pdf`, MIME.pdf, buildPdf(report))
}

export function downloadReportDocx(report) {
  downloadBlob(`${report.fileBaseName}.docx`, MIME.docx, buildDocx(report))
}

export function downloadReportXlsx(report) {
  downloadBlob(`${report.fileBaseName}.xlsx`, MIME.xlsx, buildXlsx(report))
}

function downloadBlob(filename, type, bytes) {
  const blob = new Blob([bytes], { type })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(link.href)
}

function buildPdf(report) {
  const rows = [
    `${BRAND_NAME} Operations Report`,
    `Generated: ${report.generatedAt}`,
    '',
    `Total orders: ${report.metrics.totalOrders}`,
    `Completion rate: ${report.metrics.completionRate}%`,
    `Top meal: ${report.metrics.topMeal || 'N/A'}`,
    `Top add-on: ${report.metrics.topAddon || 'N/A'}`,
    '',
    'Status Breakdown',
    ...report.statusRows.map((row) => `${row.label}: ${row.value}`),
    '',
    'Meal Demand',
    ...report.mealRows.map((row) => `${row.label}: ${row.value} orders (${row.percent}%)`),
    '',
    'Decision Support',
    ...report.insights.map((item) => `- ${item}`),
  ]

  const content = [
    'BT',
    '/F1 18 Tf',
    '50 790 Td',
    ...rows.flatMap((line, index) => {
      const font = index === 0 ? ['/F1 18 Tf'] : ['/F1 10 Tf']
      return [...font, `(${pdfEscape(line)}) Tj`, '0 -16 Td']
    }),
    'ET',
  ].join('\n')

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${byteLength(content)} >>\nstream\n${content}\nendstream`,
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(byteLength(pdf))
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xrefOffset = byteLength(pdf)
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return new TextEncoder().encode(pdf)
}

function buildDocx(report) {
  const body = [
    paragraph(`${BRAND_NAME} Operations Report`, 'Title'),
    paragraph(`Generated: ${report.generatedAt}`),
    paragraph('Executive Summary', 'Heading1'),
    table([
      ['Metric', 'Value'],
      ['Total orders', report.metrics.totalOrders],
      ['Completion rate', `${report.metrics.completionRate}%`],
      ['Top meal', report.metrics.topMeal || 'N/A'],
      ['Top add-on', report.metrics.topAddon || 'N/A'],
    ]),
    paragraph('Meal Demand Trends', 'Heading1'),
    table([['Meal', 'Orders', 'Share'], ...report.mealRows.map((row) => [row.label, row.value, `${row.percent}%`])]),
    paragraph('Passenger Preferences', 'Heading1'),
    table([['Category', 'Selections'], ...report.categoryRows.map((row) => [row.label, row.value])]),
    paragraph('Decision Support Insights', 'Heading1'),
    ...report.insights.map((item) => paragraph(item, 'ListParagraph')),
    paragraph('Order Details', 'Heading1'),
    table([
      ['Order ID', 'Seat', 'Meal', 'Drink', 'Dessert', 'Snack', 'Status'],
      ...report.orders.map((order) => [
        order.orderId,
        order.seatNumber,
        order.meal,
        order.drink,
        order.dessert,
        order.snack,
        order.status,
      ]),
    ]),
  ].join('')

  return createZip({
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
    'word/_rels/document.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`,
    'word/styles.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/></w:style>
</w:styles>`,
    'word/document.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/></w:sectPr></w:body></w:document>`,
  })
}

function buildXlsx(report) {
  const sheets = {
    'xl/worksheets/sheet1.xml': worksheet([
      ['Metric', 'Value'],
      ['Total orders', report.metrics.totalOrders],
      ['Completion rate', `${report.metrics.completionRate}%`],
      ['Top meal', report.metrics.topMeal || 'N/A'],
      ['Top add-on', report.metrics.topAddon || 'N/A'],
    ]),
    'xl/worksheets/sheet2.xml': worksheet([
      ['Meal', 'Orders', 'Share'],
      ...report.mealRows.map((row) => [row.label, row.value, `${row.percent}%`]),
    ]),
    'xl/worksheets/sheet3.xml': worksheet([
      ['Order ID', 'Seat', 'Meal', 'Drink', 'Dessert', 'Snack', 'Status'],
      ...report.orders.map((order) => [
        order.orderId,
        order.seatNumber,
        order.meal,
        order.drink,
        order.dessert,
        order.snack,
        order.status,
      ]),
    ]),
    'xl/worksheets/sheet4.xml': worksheet([['Insight'], ...report.insights.map((item) => [item])]),
  }

  return createZip({
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${Object.keys(sheets).map((name) => `<Override PartName="/${name}" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}
</Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/>
<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet4.xml"/>
</Relationships>`,
    'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>
<sheet name="Summary" sheetId="1" r:id="rId1"/>
<sheet name="Meal Demand" sheetId="2" r:id="rId2"/>
<sheet name="Orders" sheetId="3" r:id="rId3"/>
<sheet name="Insights" sheetId="4" r:id="rId4"/>
</sheets>
</workbook>`,
    ...sheets,
  })
}

function worksheet(rows) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetData>${rows.map((row, rowIndex) => `<row r="${rowIndex + 1}">${row.map((value, colIndex) => cell(value, rowIndex + 1, colIndex)).join('')}</row>`).join('')}</sheetData>
</worksheet>`
}

function cell(value, row, col) {
  const ref = `${columnName(col)}${row}`
  if (typeof value === 'number') return `<c r="${ref}"><v>${value}</v></c>`
  return `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`
}

function table(rows) {
  return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="4"/><w:left w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/><w:right w:val="single" w:sz="4"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>${rows.map((row) => `<w:tr>${row.map((value) => `<w:tc><w:p><w:r><w:t>${xmlEscape(value)}</w:t></w:r></w:p></w:tc>`).join('')}</w:tr>`).join('')}</w:tbl>`
}

function paragraph(text, style) {
  const styleXml = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''
  return `<w:p>${styleXml}<w:r><w:t>${xmlEscape(text)}</w:t></w:r></w:p>`
}

function createZip(files) {
  const encoder = new TextEncoder()
  const chunks = []
  const central = []
  let offset = 0

  Object.entries(files).forEach(([name, content]) => {
    const nameBytes = encoder.encode(name)
    const data = encoder.encode(content)
    const crc = crc32(data)
    const local = concatBytes(
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length),
      u16(nameBytes.length), u16(0), nameBytes, data,
    )
    chunks.push(local)
    central.push({
      nameBytes,
      crc,
      size: data.length,
      offset,
    })
    offset += local.length
  })

  const centralChunks = central.map((entry) =>
    concatBytes(
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(entry.crc),
      u32(entry.size), u32(entry.size), u16(entry.nameBytes.length), u16(0), u16(0), u16(0), u16(0),
      u32(0), u32(entry.offset), entry.nameBytes,
    ),
  )
  const centralSize = centralChunks.reduce((sum, item) => sum + item.length, 0)
  const end = concatBytes(
    u32(0x06054b50), u16(0), u16(0), u16(central.length), u16(central.length), u32(centralSize), u32(offset), u16(0),
  )
  return concatBytes(...chunks, ...centralChunks, end)
}

function crc32(bytes) {
  let crc = -1
  for (const byte of bytes) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ byte) & 0xff]
  }
  return (crc ^ -1) >>> 0
}

const CRC_TABLE = Array.from({ length: 256 }, (_value, index) => {
  let c = index
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function concatBytes(...parts) {
  const length = parts.reduce((sum, part) => sum + part.length, 0)
  const out = new Uint8Array(length)
  let offset = 0
  parts.forEach((part) => {
    out.set(part, offset)
    offset += part.length
  })
  return out
}

function u16(value) {
  const bytes = new Uint8Array(2)
  new DataView(bytes.buffer).setUint16(0, value, true)
  return bytes
}

function u32(value) {
  const bytes = new Uint8Array(4)
  new DataView(bytes.buffer).setUint32(0, value >>> 0, true)
  return bytes
}

function columnName(index) {
  let name = ''
  let value = index + 1
  while (value > 0) {
    const mod = (value - 1) % 26
    name = String.fromCharCode(65 + mod) + name
    value = Math.floor((value - mod) / 26)
  }
  return name
}

function xmlEscape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function pdfEscape(value) {
  return String(value ?? '').replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)')
}

function byteLength(value) {
  return new TextEncoder().encode(value).length
}
