import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

// Add type definition for jspdf-autotable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}

interface InvoiceItem {
    description: string;
    amount: number;
}

interface InvoiceData {
    invoiceNumber: string;
    date: Date;
    items: InvoiceItem[];
    totalAmount: number;
    currency: string;
    paymentMethod: string;
    status: string;
}

interface TenantData {
    name: string;
    ownerName: string;
    email: string;
    address: string;
    phone: string;
}

export const generateInvoicePDF = (invoice: InvoiceData, tenant: TenantData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFontSize(20);
    doc.text('INVOICE', pageWidth - 20, 20, { align: 'right' });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Gym SaaS Platform', 20, 20);
    doc.text('123 Tech Park, Innovation Street', 20, 25);
    doc.text('Bangalore, India 560001', 20, 30);
    doc.text('support@gymsaas.com', 20, 35);

    // Invoice Details
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, pageWidth - 20, 40, { align: 'right' });
    doc.text(`Date: ${format(invoice.date, 'dd MMM yyyy')}`, pageWidth - 20, 45, { align: 'right' });
    doc.text(`Status: ${invoice.status.toUpperCase()}`, pageWidth - 20, 50, { align: 'right' });

    // Bill To
    doc.text('Bill To:', 20, 50);
    doc.setFontSize(12);
    doc.text(tenant.name, 20, 56);
    doc.setFontSize(10);
    doc.text(tenant.ownerName, 20, 61);
    doc.text(tenant.email, 20, 66);
    doc.text(tenant.phone, 20, 71);

    // Split address into multiple lines if needed
    const splitAddress = doc.splitTextToSize(tenant.address || '', 80);
    doc.text(splitAddress, 20, 76);

    // Items Table
    const tableColumn = ["Description", "Amount"];
    const tableRows = invoice.items.map(item => [
        item.description,
        `${invoice.currency} ${(item.amount / 100).toFixed(2)}`
    ]);

    doc.autoTable({
        startY: 90,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [66, 66, 66] },
        styles: { fontSize: 10 },
        margin: { top: 10 },
    });

    // Total
    const finalY = (doc as any).lastAutoTable.finalY || 90;
    doc.setFontSize(12);
    doc.text(`Total: ${invoice.currency} ${(invoice.totalAmount / 100).toFixed(2)}`, pageWidth - 20, finalY + 10, { align: 'right' });

    doc.setFontSize(10);
    doc.text(`Payment Method: ${invoice.paymentMethod}`, 20, finalY + 10);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Thank you for your business!', pageWidth / 2, 280, { align: 'center' });

    // Save
    doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
};
