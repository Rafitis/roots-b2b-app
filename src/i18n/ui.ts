export const languages = {
    es: "Español",
    en: "English"
  };

export const defaultLang = 'es'

export const productsName = {
    en: {
        //COLORS
        Negro: 'Black',
        Gris: 'Gray',
        Blanco: 'White',
        Beige: 'Beige',

        // TALLAS
        'Pequeño: Talla 36-42': 'Small: Size 36-42',
        'Grande: A partir de la talla 43': 'Large: Size 43 and above',
        'Talla S': 'Size S',
        'Talla M': 'Size M',

        // TAGS
        'ROOTS CARE': 'Roots Care',
        'CALCETINES': 'Anatomical Socks',
        'CALZADO BAREFOOT': 'Barefoot Footwear',
        'PREVENTA': 'Pre Sale',

        // PRODUCTS
        // ROOTS CARE
        8626078875979: 'Bunion Corrective Band',
        8595970195787: 'Toe Spacers',
        8588522815819: 'Massage Ball',
        8587131257163: 'Toe Separators',
        10283919180107: 'Toe Separators - ADAPT',
        10080794902859: 'Advance Toe Separators',

        //CALCETINES
        10235562557771: 'Anatomical socks - Home',
        10235368079691: 'Anatomical socks - Half-Calf',
        10235438661963: 'Anatomical socks - Techniques',
        8587133780299: 'Anatomical socks - Ankle',
        10046687543627: 'Anatomical socks - Tabi',
        10046685413707: 'Anatomical socks - Invisible',
        10543671968075: "Women's stockings - Half-Round",
        10404274995531: "Complete Women's Stockings",

        //Plantillas
        10221487522123: 'Transition Insoles - Wider',
        10407260225867: 'Transition Insoles - Active',
        10338027995467: 'Transition Insoles - Warmer',

        //Packs
        10486628680011: 'Pack Alignment',
        10598470844747: 'Pack Sport',
        10554029113675: 'Pack Balance',
        10598470025547: 'Pack Relax',
    }
}

export const ui = {
    es: {
        'nav.products': 'Productos',
        'nav.cart': 'Carrito',
        'nav.logout': 'Cerrar sesión',

        'product.add': 'Añadir al carrito',
        'product.variant': 'Elige variante',
        'product.noStock': 'Sin Stock',
        'product.quantity': 'Cantidad',
        'product.preOrder': 'Preventa',
        'product.pricePerUnit': 'Precio por Unidad',

        'cart.infoTitle': 'Información del Cliente',
        'cart.namePlaceholder': 'Nombre Fiscal',
        'cart.nifPlaceholder': 'NIF o CIF',
        'cart.addressPlaceholder': 'Dirección',
        'cart.tax': 'Recargo Equivalencia',
        
        'table.title': 'Carrito de Compras',
        'table.name': 'Nombre',
        'table.color': 'Color',
        'table.priceUnit': 'Precio por Unidad',
        'table.discount': 'Descuento',
        'table.total': 'Precio Total',
        'table.delete': 'Eliminar',

        'download.message': 'Descargar Factura',
        'download.generating': 'Generando Factura...',
        'download.error': 'Error generando factura',
        'download.documentTitle': 'Factura',
        'download.noItemsMessage': 'No hay artículos para generar factura.',

        'global.delete': 'Eliminar Todo',
        
        'invoice.clientDetails': 'DETALLES DE FACTURACIÓN CLIENTE',
        'invoice.clientName': 'NOMBRE',
        'invoice.clientNifCif': 'NIF o CIF',
        'invoice.clientAddress': 'DIRECCIÓN',
        'invoice.dateTitle': 'Fecha',
        'invoice.invoiceNumber': 'Facura',
        
        'invoice.table.item': 'Concepto',
        'invoice.table.quantity': 'Cantidad',
        'invoice.table.color': 'Color',
        'invoice.table.size': 'Talla',
        'invoice.table.pricePVP': 'Precio PVP ROOTS',
        'invoice.table.discount': 'DTO',
        'invoice.table.priceUnit': 'Precio Final Unidad', 
        'invoice.table.total': 'Precio Total',

        'invoice.total.totalNoTax': 'TOTAL SIN IVA',
        'invoice.total.iva': 'IVA',
        'invoice.total.recharge': 'RECARGO DE EQUIVALENCIA',
        'invoice.total.total': 'TOTAL',
        'invoice.total.prepay': 'RESERVA',
        'invoice.total.pending': 'PENDIENTE DE PAGO',

        'invoice.roots.info': 'FACTURADO POR',
        'invoice.roots.payment': 'Forma de pago: Transferencia',
        'invoice.roots.iban': 'Nº de Cuenta',
        'invoice.roots.address': 'Remitente',

    },
    en: {
        'nav.products': 'Products',
        'nav.cart': 'Cart',
        'nav.logout': 'Logout',

        'product.add': 'Add to Cart',
        'product.variant': 'Select Variant',
        'product.noStock': 'Out of Stock',
        'product.quantity': 'Quantity',
        'product.preOrder': 'Pre Order',
        'product.pricePerUnit': 'Price per Unit',

        'cart.infoTitle': 'Customer Information',
        'cart.namePlaceholder': 'Legal Name',
        'cart.nifPlaceholder': 'NIF or CIF',
        'cart.addressPlaceholder': 'Address',
        'cart.tax': 'Recargo Equivalencia',
        
        'table.title': 'Shopping Cart',
        'table.name': 'Name',
        'table.color': 'Color',
        'table.priceUnit': 'Price per Unit',
        'table.discount': 'Discount',
        'table.total': 'Total Price',
        'table.delete': 'Delete',

        'download.message': 'Download Invoice',
        'download.generating': 'Generating Invoice...',
        'download.error': 'Error generating invoice',
        'download.documentTitle': 'Invoice',
        'download.noItemsMessage': 'No items to generate invoice.',

        'global.delete': 'Delete All',

        'invoice.clientDetails': 'DETAILS OF THE INVOICE',
        'invoice.clientName': 'NAME',
        'invoice.clientNifCif': 'NIF or CIF',
        'invoice.clientAddress': 'ADDRESS',
        'invoice.dateTitle': 'Date',
        'invoice.invoiceNumber': 'Invoice',

        'invoice.table.item': 'Concept',
        'invoice.table.quantity': 'Quantity',
        'invoice.table.color': 'Color',
        'invoice.table.size': 'Size',
        'invoice.table.pricePVP': 'Price PVP ROOTS',
        'invoice.table.discount': 'DTO',
        'invoice.table.priceUnit': 'Price Final Unit',
        'invoice.table.total': 'Total Price',

        'invoice.total.totalNoTax': 'TOTAL WITHOUT TAX',
        'invoice.total.iva': 'IVA',
        'invoice.total.recharge': 'RECHARGE OF EQUIVALENCE',
        'invoice.total.total': 'TOTAL',
        'invoice.total.prepay': 'PAY IN ADVANCE',
        'invoice.total.pending': 'PENDING PAYMENT',

        'invoice.roots.info': 'INVOICE ISSUED BY',
        'invoice.roots.payment': 'Payment Method: Transfer',
        'invoice.roots.iban': 'Account Number',
        'invoice.roots.address': 'Sender',

    }
} as const