import React from "react";

export default function AppDownload() {
  return (
    <section className="py-12 md:py-16">
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="md:w-1/2">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Download the Errands Mate App
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Get access to our services on the go. Available for iOS and Android
            devices.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="#"
              className="flex items-center bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <svg
                className="w-7 h-7 mr-3"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.5646 12.9838C17.5495 10.5341 19.5438 9.41714 19.6309 9.36418C18.4159 7.59293 16.5033 7.33577 15.8376 7.31793C14.2023 7.15396 12.6242 8.30287 11.7945 8.30287C10.9467 8.30287 9.66831 7.33577 8.27885 7.36838C6.52544 7.40099 4.89359 8.42232 4.00683 9.99849C2.16516 13.2036 3.50366 17.9573 5.26921 20.3723C6.15596 21.5493 7.18595 22.8878 8.52445 22.8341C9.83612 22.7805 10.3245 22.0081 11.8855 22.0081C13.4286 22.0081 13.8992 22.8341 15.274 22.8073C16.6888 22.7805 17.5827 21.6142 18.4339 20.4224C19.4638 19.0482 19.8754 17.6918 19.8906 17.6208C19.8602 17.6087 17.5827 16.7301 17.5646 12.9838Z" />
                <path d="M15.0657 5.82237C15.7859 4.93562 16.2627 3.73594 16.1406 2.5C15.0878 2.54738 13.8066 3.2079 13.0561 4.07678C12.3905 4.84316 11.8157 6.07807 11.9532 7.2777C13.1227 7.36886 14.3274 6.69361 15.0657 5.82237Z" />
              </svg>
              App Store
            </a>
            <a
              href="#"
              className="flex items-center bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <svg
                className="w-7 h-7 mr-3"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M3.60946 20.5886L12.0128 12.1852L3.60946 3.78186C3.18228 4.20904 2.93091 4.79777 2.93091 5.48901V18.8815C2.93091 19.5727 3.18228 20.1614 3.60946 20.5886ZM14.0173 14.1898L16.7262 11.481L4.86671 4.24682C4.60311 4.09546 4.31401 4.00003 4.00952 4.00003C3.70503 4.00003 3.41592 4.09546 3.15232 4.24682L14.0173 14.1898ZM17.9376 12.1852L14.9519 15.1709L17.8103 17.1328L20.8051 15.448C21.3575 15.1257 21.6992 14.5551 21.6992 13.934V10.4364C21.6992 9.81537 21.3575 9.24473 20.8051 8.92244L17.9376 12.1852ZM3.15232 20.1236C3.41592 20.2749 3.70503 20.3704 4.00952 20.3704C4.31401 20.3704 4.60311 20.2749 4.86671 20.1236L16.7262 12.8894L14.0173 10.1806L3.15232 20.1236Z" />
              </svg>
              Google Play
            </a>
          </div>
        </div>
        <div className="md:w-1/2 mt-8 md:mt-0">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 shadow-lg">
            <div className="aspect-[9/16] bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-300 text-center">
                Mobile app screenshot
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
