// script.js - সমস্ত ফাংশন এবং লজিক

document.addEventListener('DOMContentLoaded', function() {
    // HTML এলিমেন্টগুলোকে সিলেক্ট করা হচ্ছে
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const logList = document.getElementById('logList');
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.card p');

    // লগ যোগ করার ফাংশন
    function addLog(message) {
        const li = document.createElement('li');
        const time = new Date().toLocaleTimeString();
        li.textContent = `[${time}] ${message}`;
        logList.prepend(li); // নতুন লগ সবার উপরে দেখানোর জন্য
    }

    // Start System বাটনের কাজ
    startBtn.addEventListener('click', function() {
        statusIndicator.textContent = 'Online';
        statusIndicator.className = 'status-indicator online';
        statusText.textContent = 'বর্তমানে সমস্ত সিস্টেম স্বাভাবিকভাবে চলছে। কোনো ত্রুটি পাওয়া যায়নি।';
        addLog('সিস্টেম ম্যানুয়ালি চালু করা হয়েছে।');
        
        // বাটন স্ট্যাটাস আপডেট
        startBtn.disabled = true;
        startBtn.style.opacity = '0.5';
        startBtn.style.cursor = 'not-allowed';
        
        stopBtn.disabled = false;
        stopBtn.style.opacity = '1';
        stopBtn.style.cursor = 'pointer';
    });

    // Stop System বাটনের কাজ
    stopBtn.addEventListener('click', function() {
        statusIndicator.textContent = 'Offline';
        statusIndicator.className = 'status-indicator offline';
        statusText.textContent = 'সিস্টেম বর্তমানে বন্ধ আছে।';
        addLog('সিস্টেম ম্যানুয়ালি বন্ধ করা হয়েছে।');
        
        // বাটন স্ট্যাটাস আপডেট
        stopBtn.disabled = true;
        stopBtn.style.opacity = '0.5';
        stopBtn.style.cursor = 'not-allowed';
        
        startBtn.disabled = false;
        startBtn.style.opacity = '1';
        startBtn.style.cursor = 'pointer';
    });
});
