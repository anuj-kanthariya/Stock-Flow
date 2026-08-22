import io
from datetime import datetime
from decimal import Decimal
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from app.models.models import Invoice

def format_currency(value: Decimal) -> str:
    """Format value to Indian Rupee (₹) string without using external libraries that may cause locale issues"""
    val = float(value)
    # Simple formatting: reportlab supports UTF-8, so we can use the ₹ symbol directly
    return f"₹{val:,.2f}"

def generate_invoice_pdf(invoice: Invoice) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter,
        rightMargin=40, leftMargin=40,
        topMargin=40, bottomMargin=40
    )
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor("#f97316"), # StockFlow Orange
        spaceAfter=5
    )
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.gray,
        spaceAfter=20
    )
    heading_style = ParagraphStyle(
        'HeadingStyle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor("#333333"),
        spaceAfter=10
    )
    normal_style = styles['Normal']
    
    # Header (Company Info)
    owner = invoice.created_by_user
    company_name = owner.company_name if owner and owner.company_name else "My Business"
    
    # We could add the logo here if we had the path, but since images can be URLs or local, 
    # and ReportLab requires actual file paths or accessible URLs, we'll keep it text-based for now.
    # The requirement said "[LOGO] ANUJ'S SHOP", we will just print the text prominently as the business identity.
    elements.append(Paragraph(company_name.upper(), title_style))
    
    if owner and owner.business_address:
        elements.append(Paragraph(owner.business_address, subtitle_style))
    else:
        elements.append(Spacer(1, 0.2 * inch))
    
    # Add contact info below if needed
    contact_info = []
    if owner and owner.phone: contact_info.append(owner.phone)
    if owner and owner.email: contact_info.append(owner.email)
    if owner and owner.gst_number: contact_info.append(f"GST: {owner.gst_number}")
    
    if contact_info:
        elements.append(Paragraph(" | ".join(contact_info), subtitle_style))
    else:
        elements.append(Spacer(1, 0.2 * inch))
    
    # Invoice Details Table
    inv_date = invoice.created_at.strftime("%d %b %Y") if invoice.created_at else "N/A"
    
    invoice_data = [
        [Paragraph("<b>INVOICE</b>", heading_style), ""],
        [f"Invoice #:", invoice.invoice_number],
        [f"Date:", inv_date],
        [f"Status:", invoice.status.capitalize() if invoice.status else "Pending"]
    ]
    
    if invoice.due_date:
        invoice_data.append([f"Due Date:", invoice.due_date.strftime("%d %b %Y")])
        
    t_invoice = Table(invoice_data, colWidths=[1.5*inch, 3*inch])
    t_invoice.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
    ]))
    
    # Customer Details
    customer = invoice.customer
    customer_info = [
        [Paragraph("<b>BILL TO:</b>", heading_style)],
        [customer.name]
    ]
    if customer.phone:
        customer_info.append([customer.phone])
    if customer.email:
        customer_info.append([customer.email])
        
    t_customer = Table(customer_info, colWidths=[4*inch])
    t_customer.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 2),
    ]))
    
    # Layout Invoice and Customer side by side
    top_table = Table([[t_customer, t_invoice]], colWidths=[4*inch, 3.5*inch])
    top_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    elements.append(top_table)
    elements.append(Spacer(1, 0.5 * inch))
    
    # Items Table
    item_data = [["Product", "SKU", "Qty", "Unit Price", "Total"]]
    for item in invoice.items:
        prod = item.product
        item_data.append([
            Paragraph(prod.name, normal_style),
            prod.sku or "-",
            str(item.quantity),
            format_currency(item.unit_price),
            format_currency(item.total)
        ])
        
    t_items = Table(item_data, colWidths=[2.75*inch, 1.25*inch, 0.75*inch, 1.25*inch, 1.5*inch])
    t_items.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#334155")),
        ('ALIGN', (0, 0), (1, -1), 'LEFT'),
        ('ALIGN', (2, 0), (2, -1), 'CENTER'),
        ('ALIGN', (3, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
    ]))
    elements.append(t_items)
    elements.append(Spacer(1, 0.2 * inch))
    
    # Totals Table
    totals_data = [
        ["Subtotal:", format_currency(invoice.subtotal)],
    ]
    if invoice.discount_amount and invoice.discount_amount > 0:
        totals_data.append(["Discount:", f"- {format_currency(invoice.discount_amount)}"])
        
    totals_data.append([f"Tax ({invoice.tax_rate}%):", format_currency(invoice.tax_amount)])
    totals_data.append(["Total:", format_currency(invoice.total)])
    
    t_totals = Table(totals_data, colWidths=[1.5*inch, 1.5*inch])
    t_totals.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, -1), (-1, -1), colors.HexColor("#f97316")),
        ('LINEABOVE', (0, -1), (-1, -1), 1, colors.HexColor("#e2e8f0")),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    
    # Wrap totals to align right
    totals_wrapper = Table([["", t_totals]], colWidths=[4.5*inch, 3*inch])
    totals_wrapper.setStyle(TableStyle([
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
    ]))
    elements.append(totals_wrapper)
    
    if invoice.notes:
        elements.append(Spacer(1, 0.5 * inch))
        elements.append(Paragraph("<b>Notes:</b>", heading_style))
        elements.append(Paragraph(invoice.notes, normal_style))
        
    doc.build(elements)
    buffer.seek(0)
    return buffer
