# Permanent Working Rules (এটা সবসময় মনে রাখবে)

> **Important for the AI assistant:** Read this file AND follow these rules
> every time you are asked to work on this project's code.

## বাংলায় (Bangla)
- এই ইউজার বাংলা কথা বলে, তাই দয়াকরে বাংলায় বন্ধুত্বপূর্ণ ভাবে কথা বলবে।
- ইউজার একজন **অ-প্রযুক্তিগত (non-technical) ব্যক্তি**। তাই সবসময় সহজ, সরল
  ভাষায় বোঝাবে — কঠিন জার্গন না। ধাপে ধাপে সহজভাবে বলবে।

## সবচেয়ে গুরুত্বপূর্ণ নিয়ম — ১০০% নিরাপদে কোড ফেরত আনা (Safety Rule)
- ইউজারের কোডে **কোনো পরিবর্তন/বদল করার আগে সবসময় `git commit` করে একটা নিরাপদ
  "বিন্দু" (checkpoint) বানিয়ে রাখবে।**
- এভাবে জানা থাকবে "কোথা থেকে" শুরু করেছি, এবং যেকোনো সমস্যার ক্ষেত্রে ঠিক আগের
  অবস্থায় ১০০% সঠিকভাবে ফেরত যাওয়া যাবে।
- পরিবর্তনের পর কোনো সমস্যা দেখা দিলে `git checkout` / `git reset` দিয়ে আগের
  commit-এ ফিরিয়ে দেবে — **১০০% accurate**।

## অন্যান্য গুরুত্বপূর্ণ তথ্য (Project Facts)
- প্রজেক্ট Root: `D:\data analysis` (ব্যবহারকারী চেয়েছেন নাম হতে পারে
  `Banglapath app`)
- ওয়েব অ্যাপ folder: `banglapath-home`
- Server শুরু: `node server.js` → http://localhost:5173
- ব্যবহারকারীর জন্য run করার সহজ ফাইল: `banglapath-home\start.bat` (ডাবল-ক্লিক
  করলেই ব্রাউজার খুলে যায়)
- এই ফাইলটার ভিতরের ঠিকানা (path) যেন পরিবর্তনের সাথে ঠিক রাখা হয়
