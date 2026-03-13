with open('src/pages/BookAppointmentPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()
idx = content.find('Verify deposit')
print(repr(content[idx:idx+400]))
