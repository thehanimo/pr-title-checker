import * as core from '@actions/core'
import * as github from '@actions/github'

const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/')
const issue_number = github.context.issue.number
const { Octokit } = require('@octokit/action')
let octokit
let JIRA_TICKETS = []

// most @actions toolkit packages have async methods
async function run() {
  try {
    const title = github.context.payload.pull_request.title
    const labels = github.context.payload.pull_request.labels
    const firstbody=github.context.payload.pull_request.body
    core.info(`body data ${firstbody}`)
    const getJiraTicketsFromPrTitle = () => {
      //const trimmedTitle=title.replaceAll(" ","")
      JIRA_TICKETS = title.split('-')[0].split('|')
      core.info(` JIRA Ticket ${JIRA_TICKETS}`)
    }
    const buildCommentBody = (firstbody) => {
      const urlTicket = 'https://support.apps.darva.com/browse/SINAPPSHAB-'
      let ticket= 'Tickets:'
      let tab=[] 
      let newBody=''
      let bd=''
      JIRA_TICKETS.map((e)=> {
        tab.push('\r\n',urlTicket.concat(e))
      })
      if(firstbody.includes('---------------------------')){
        bd=firstbody.split('---------------------------')[1]
        core.info(`bd (${bd}) `)
      }
     return ticket.concat('\r\n',...tab).concat('\r\n','--------------------------').concat('\r\n',bd)
    }
    core.info(` PR Title ${title}`)
    let pattern = /\d{4,5}/
    const titleContainsJiraNumbers = pattern.test(title, 'i')
    let body
    if (titleContainsJiraNumbers) {
      getJiraTicketsFromPrTitle()
      core.setOutput('JIRA_TICKETS', JIRA_TICKETS)
      body = buildCommentBody(firstbody)
      await createOrUpdateComment(body)
    } else {
      await addLabel('NotLinkedToJira')
      core.setOutput('JIRA_TICKETS', [])
    }
  } catch (error) {
    core.info(error)
  }
}

async function createOrUpdateComment(body) {
  core.info(`createOrUpdateComment (${body}) to PR...`)
  await octokit.rest.pulls.update({
    owner,
    repo,
    pull_number: issue_number,
    body:body,
  })

  const bodyPR = github.context.payload.pull_request.body.split('----------')[0]
  if(bodyPR !=''){
   
  }
}
async function addLabel(name) {
  core.info(`Adding label (${name}) to PR...`)
  core.info(`body (${body}) `)
  let addLabelResponse = await octokit.issues.addLabels({
    owner,
    repo,
    issue_number,
    labels: [name],
  })
  core.info(`Added label (${name}) to PR - ${addLabelResponse.status}`)
}

try {
  octokit = new Octokit()
} catch (e) {
  handleOctokitError(e)
}

if (octokit) {
  run()
}
