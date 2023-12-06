$(document).ready(function () {
    // Listen for input changes in the search bar
    $('#searchInput').on('input', function () {
        const searchText = $(this).val().toLowerCase();

        // Loop through each row in the orders table and hide/show based on search text
        $('#search-table tbody tr').each(function () {
            const row = $(this);

            // Check if any cell in the row contains the search text
            const found = row.find('td').toArray().some(function (cell) {
                const cellText = $(cell).text().toLowerCase();
                return cellText.includes(searchText);
            });

            // Show or hide the row accordingly
            if (found) {
                row.show();
            } else {
                row.hide();
            }
        });
    });
});