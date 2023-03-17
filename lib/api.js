import ky from 'ky'

export const INVOICE_STATE_UNPAID = 'UNPAID'
export const INVOICE_STATE_PAID = 'PAID'

// Set up an API client.
export const createClient = (apiUrl, apikey) => {
  return ky.create({
    prefixUrl: apiUrl,
    headers: {
      Authorization: `Bearer ${apikey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })
}

export const getProfile = async (client, id) => {
  return await client.get(`accounts/${id}/profile`).json()
}

const createInvoice = async (client, handle, amount, currency, description = 'Tip!') => {
  return await client
    .post(`invoices/handle/${handle}`, { json: { amount: { currency: currency, amount: amount } } })
    .json()
}

const createQuote = async (client, invoiceId) => {
  return await client.post(`invoices/${invoiceId}/quote`).json()
}

export const getLnQuote = async (client, lnInvoice, sourceCurrency = 'USD') => {
  try {
    return await client
      .post(`payment-quotes/lightning`, {
        json: { lnInvoice, sourceCurrency },
      })
      .json()
  } catch (error) {
    console.error(await error.response.text())
  }
}

export const payLnQuote = async (client, quoteId) => {
  return await client.patch(`payment-quotes/${quoteId}/execute`).json()
}

const getInvoice = async (client, invoiceId) => {
  return await client.get(`invoices/${invoiceId}`).json()
}

const getInvoices = async (client) => {
  return await client.get(`invoices/`).json()
}

const pollInvoice = async (invoice, until) => {
  return await poll(
    () => getInvoice(invoice.invoiceId),
    ({ state }) => state == INVOICE_STATE_PAID,
    until,
    1000
  ).catch((err) => console.error(err))
}

const setCurrecyOptions = () => {
  var fragment = document.createDocumentFragment()
  profile.currencies.forEach(function (curerncy, index) {
    var opt = document.createElement('option')
    opt.innerHTML = curerncy.currency
    opt.value = curerncy.currency
    fragment.appendChild(opt)
  })
  currencyField.appendChild(fragment)
  currencyField.value = profile.currencies.find((c) => c.isDefaultCurrency).currency
}
