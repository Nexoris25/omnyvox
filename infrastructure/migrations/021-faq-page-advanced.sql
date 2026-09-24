-- FAQ is no longer a default page; Advanced websites can add an FAQ page
-- (with FAQPage structured data) from Pages. Existing FAQ pages are kept.
UPDATE industries SET core_pages = core_pages - 'FAQ' WHERE core_pages ? 'FAQ';
