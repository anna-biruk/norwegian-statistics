app.post('/api/extract', upload.single('file'), async (req, res) => {
    // Move this kind of logging to a middleware to avoid repeating it in every route.
    logInfo('POST /api/extract', req.body);
    // don't log the file buffer as it may contain sensitive information.
    logInfo('FILE=', req.file);

    // reverse the if statement to avoid nested if statements.
    if (req.body) {
        const file = req.file;
        const requestID = req.body.requestID;
        const project = req.body.project;
        const idUser = req.body.userID;
        // It would be great to use a middleware to inject the user into the req.user
        // so that we don't have to repeat that everywhere
        const user = await User.findOne(idUser);

        // reverse the if statement to avoid nested if statements.
        // if any of the required fields are missing, return a 500 error. return res.status(500).json({requestID, message: 'Missing requried input (requestID, project, file)'});
        if (requestID && project && idUser && user) {
            // let's avoid logging the user object as it may contain sensitive information.
            logDebug('User with role ' + user.role, user);
            // Use curly braces for if statements for consistency.
            if (user.role === 'ADVISOR' || user.role.indexOf('ADVISOR') > -1)
                return res.json({ requestID, step: 999, status: 'DONE', message: 'Nothing to do for ADVISOR role' });

            // Move the business logic to a separate function(service layer) to make the code more readable.
            // This will also make it easier to test the business logic. It's not the responsibility of the controller to handle business logic.
            /* reset status variables */
            // "Magic numbers" should be avoided, use constants instead. Unclear what 1 means here
            await db.updateStatus(requestID, 1, '');

            // config is a global variable, let's avoid logging it as it may contain sensitive information.
            logDebug('CONFIG:', config.projects);
            // reverse the if statement to avoid nested if statements.
            // if the project is not in the config, return a 500 error. return res.status(500).json({requestID, message: 'Invalid project'});
            if (project === 'inkasso' && config.projects.hasOwnProperty(project) && file) {
                // hashSub doesn't seem to be used in this contaxt. It would be better to remove it. Unless there's a reason to keep it.
                const hashSum = crypto.createHash('sha256');
                const fileHash = idUser;
                // Move the defualt filename to config or env variables.
                const fileName = 'fullmakt';
                const fileType = mime.getExtension(file.mimetype);
                if (fileType !== 'pdf')
                    return res.status(500).json({ requestID, message: 'Missing pdf file' });
                //Same here. magic numbers should be avoided, use constants instead. Unclear what 2 means here
                await db.updateStatus(requestID, 3, '');

                const folder = `${project}-signed/${idUser}`;
                // log the file buffer as it may contain sensitive information and seem to be a duplicate of the log above. I'm curious why it called FILE2 in the log. It doesn't seem to change since the previous log.
                logDebug('FILE2=', file);
                await uploadToGCSExact(folder, fileHash, fileName, fileType, file.mimetype, file.buffer);
                // magic numbers should be avoided, use constants instead. Unclear what 4 means here
                await db.updateStatus(requestID, 4, '');
                // the naming is a bit confusing. It's not clear what ret is. It would be better to name it something more descriptive.
                const ret = await db.updateUploadedDocs(idUser, requestID, fileName, fileType, file.buffer);
                // might also contain sensitive information. It's better to avoid logging it.
                logDebug('DB UPLOAD:', ret);

                // magic numbers should be avoided, use constants instead. Unclear what 5 means here
                await db.updateStatus(requestID, 5, '');

                // this variable doesn't seem to be used. It would be better to remove it. or Figure out where it should be used. might be a bug.
                let sent = true;
                const debtCollectors = await db.getDebtCollectors();
                // might also contain sensitive information. It's better to avoid logging it.
                logDebug('debtCollectors=', debtCollectors);
                // use curly braces for if statements for consistency.
                if (!debtCollectors)
                    return res.status(500).json({ requestID, message: 'Failed to get debt collectors' });

                // the fix comment is not clear. It would be better to explain what the issue is and how it's fixed.
                if (!!(await db.hasUserRequestKey(idUser))) { //FIX: check age, not only if there's a request or not
                    //magic numbers should be avoided, use constants instead. Unclear what 999 means here
                    return res.json({ requestID, step: 999, status: 'DONE', message: 'Emails already sent' });
                }

                const sentStatus = {};
                // too big of a loop. It would be better to move the logic inside the loop to a separate function or sevearal functions.
                for (let i = 0; i < debtCollectors.length; i++) {
                    // unclear why is it 10 + i. It would be better to name "10" something more descriptive.
                    await db.updateStatus(requestID, 10 + i, '');
                    const idCollector = debtCollectors[i].id;
                    const collectorName = debtCollectors[i].name;
                    const collectorEmail = debtCollectors[i].email;
                    const hashSum = crypto.createHash('sha256');
                    const hashInput = `${idUser}-${idCollector}-${(new Date()).toISOString()}`;
                    // do we need to log it?
                    logDebug('hashInput=', hashInput);
                    hashSum.update(hashInput);
                    const requestKey = hashSum.digest('hex');
                    // do we need to log it?
                    logDebug('REQUEST KEY:', requestKey);

                    const hash = Buffer.from(`${idUser}__${idCollector}`, 'utf8').toString('base64')

                    // might be a good idea to run this 2 promises in parallel using Promise.all. it would be faster.
                    if (!!(await db.setUserRequestKey(requestKey, idUser))
                        && !!(await db.setUserCollectorRequestKey(requestKey, idUser, idCollector))) {

                        // This should be moved to a config file outside the code. It's better to avoid hardcoding values.
                        // also, it worth deligating this work to a separate email service to avoid repeating it every time.
                        /* prepare email */
                        const sendConfig = {
                            sender: config.projects[project].email.sender,
                            replyTo: config.projects[project].email.replyTo,
                            subject: 'Email subject',
                            templateId: config.projects[project].email.template.collector,
                            params: {
                                downloadUrl: `https://url.go/download?requestKey=${requestKey}&hash=${hash}`,
                                uploadUrl: `https://url.go/upload?requestKey=${requestKey}&hash=${hash}`,
                                confirmUrl: `https://url.go/confirm?requestKey=${requestKey}&hash=${hash}`
                            },
                            tags: ['request'],
                            to: [{ email: collectorEmail, name: collectorName }],
                        };
                        // might contain sensitive information. It's better to avoid logging it.
                        logDebug('Send config:', sendConfig);

                        try {
                            await db.setEmailLog({ collectorEmail, idCollector, idUser, requestKey })
                        } catch (e) {
                            // shouldn't we use logError instead of logDebug?
                            logDebug('extract() setEmailLog error=', e);
                        }

                        /* send email */
                        const resp = await email.send(sendConfig, config.projects[project].email.apiKey);
                        logDebug('extract() resp=', resp);

                        // update DB with result
                        await db.setUserCollectorRequestKeyRes(requestKey, idUser, idCollector, resp);

                        // use curly braces for if statements for consistency.
                        if (!sentStatus[collectorName])
                            sentStatus[collectorName] = {};
                        sentStatus[collectorName][collectorEmail] = resp;

                        if (!resp) {
                            logError('extract() Sending email failed: ', resp);
                        }
                    }
                }
                // magic numbers should be avoided, use constants instead. Unclear what 100 means here
                await db.updateStatus(requestID, 100, '');

                logDebug('FINAL SENT STATUS:');
                console.dir(sentStatus, { depth: null });

                // did you forget to uncomment this line?
                // or should it be removed?
                //if (!allSent)
                //return res.status(500).json({requestID, message: 'Failed sending email'});
                // magic numbers should be avoided, use constants instead. Unclear what 500 means here
                await db.updateStatus(requestID, 500, '');

                // this is a duplication, better use email service to send emails.
                /* prepare summary email */
                const summaryConfig = {
                    //bcc: [{ email: 'unknown@domain.com', name: 'Tomas' }],
                    sender: config.projects[project].email.sender,
                    replyTo: config.projects[project].email.replyTo,
                    subject: 'Oppsummering Kravsforespørsel',
                    templateId: config.projects[project].email.template.summary,
                    params: {
                        collectors: sentStatus,
                    },
                    tags: ['summary'],
                    // let's apply the suggested fix for this. It's better to avoid hardcoding values.
                    to: [{ email: 'unknown@otherdomain.no', name: 'Tomas' }], // FIXXX: config.projects[project].email.sender
                };
                // might contain sensitive information. It's better to avoid logging it.
                logDebug('Summary config:', summaryConfig);

                // did you forget to uncomment this?
                /* send email */
                //const respSummary = await email.send(sendConfig, config.projects[project].email.apiKey);
                //logDebug('extract() summary resp=', respSummary);

                await db.updateStatus(requestID, 900, '');
            }
            // magic numbers should be avoided, use constants instead. Unclear what 999 means here
            await db.updateStatus(requestID, 999, '');
            return res.json({ requestID, step: 999, status: 'DONE', message: 'Done sending emails...' });
        } else
            return res.status(500).json({ requestID, message: 'Missing requried input (requestID, project, file)' });
    }
    res.status(500).json({ requestID: '', message: 'Missing requried input (form data)' });
});
